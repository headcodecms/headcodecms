//! The content schema of a project, pushed by the site with `schema_push`.
//! Sections are JSON Schemas (the site writes them with Zod); globals and
//! collections say which sections an entry may use. Entries are globals by
//! slug ("home") or collection items by collection and name ("blog/hello").

use std::collections::{BTreeMap, HashMap};

use jsonschema::Validator;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone, Deserialize, Serialize, JsonSchema)]
pub struct Schema {
    /// Section name -> JSON Schema of the section's data. Field types for the
    /// admin and descriptions for agents are part of the JSON Schema.
    pub sections: BTreeMap<String, Value>,
    /// Single entries, for example "home" (path "/") or "header".
    #[serde(default)]
    pub globals: Vec<EntryType>,
    /// Many entries of one kind, for example "blog"; an item's slug is "blog/<name>".
    #[serde(default)]
    pub collections: Vec<EntryType>,
}

#[derive(Clone, Deserialize, Serialize, JsonSchema)]
pub struct EntryType {
    /// Lowercase letters, digits and dashes.
    pub slug: String,
    /// The URL path on the site, if it has one, for example "/pricing".
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(default)]
    pub description: String,
    /// The section names an entry of this type may use, in any order.
    pub sections: Vec<String>,
}

#[derive(Clone, Deserialize, Serialize, JsonSchema)]
pub struct Section {
    /// A section name from the schema.
    pub name: String,
    /// The section's data; must match its JSON Schema.
    pub data: Value,
}

/// A schema whose section JSON Schemas are compiled.
pub struct Compiled {
    schema: Schema,
    validators: HashMap<String, Validator>,
}

impl Schema {
    /// Fails with every problem of the schema itself.
    pub fn compile(self) -> Result<Compiled, Vec<String>> {
        let mut problems = vec![];
        let mut validators = HashMap::new();
        for (name, section) in &self.sections {
            if !is_slug(name) {
                problems.push(format!(
                    "section \"{name}\": use lowercase letters, digits and dashes"
                ));
            }
            match jsonschema::validator_for(section) {
                Ok(validator) => {
                    validators.insert(name.clone(), validator);
                }
                Err(error) => problems.push(format!("section \"{name}\": {error}")),
            }
        }
        let mut slugs = vec![];
        for entry_type in self.globals.iter().chain(&self.collections) {
            let slug = &entry_type.slug;
            if !is_slug(slug) {
                problems.push(format!(
                    "\"{slug}\": use lowercase letters, digits and dashes"
                ));
            }
            if slugs.contains(&slug) {
                problems.push(format!("\"{slug}\" is defined twice"));
            }
            slugs.push(slug);
            for name in &entry_type.sections {
                if !self.sections.contains_key(name) {
                    problems.push(format!("\"{slug}\" uses the unknown section \"{name}\""));
                }
            }
        }
        if problems.is_empty() {
            Ok(Compiled {
                schema: self,
                validators,
            })
        } else {
            Err(problems)
        }
    }
}

impl Compiled {
    pub fn schema(&self) -> &Schema {
        &self.schema
    }

    /// Every problem of an entry; empty if it is valid.
    pub fn check(&self, slug: &str, sections: &[Section]) -> Vec<String> {
        let Some(entry_type) = self.entry_type(slug) else {
            let globals: Vec<_> = self
                .schema
                .globals
                .iter()
                .map(|g| g.slug.as_str())
                .collect();
            let collections: Vec<_> = self
                .schema
                .collections
                .iter()
                .map(|c| format!("{}/<name>", c.slug))
                .collect();
            return vec![format!(
                "\"{slug}\" is not in the schema; globals: {}; collection items: {}",
                list(&globals),
                list(&collections),
            )];
        };
        let mut problems = vec![];
        for (i, section) in sections.iter().enumerate() {
            let name = &section.name;
            if !entry_type.sections.contains(name) {
                problems.push(format!(
                    "sections[{i}]: \"{name}\" is not allowed in \"{slug}\"; allowed: {}",
                    list(&entry_type.sections),
                ));
                continue;
            }
            for error in self.validators[name].iter_errors(&section.data) {
                problems.push(format!(
                    "sections[{i}] ({name}) {}: {error}",
                    error.instance_path()
                ));
            }
        }
        problems
    }

    /// A global by its slug, or a collection by "<collection>/<name>".
    fn entry_type(&self, slug: &str) -> Option<&EntryType> {
        match slug.split_once('/') {
            None => self.schema.globals.iter().find(|g| g.slug == slug),
            Some((collection, name)) if is_slug(name) => self
                .schema
                .collections
                .iter()
                .find(|c| c.slug == collection),
            Some(_) => None,
        }
    }
}

fn is_slug(s: &str) -> bool {
    !s.is_empty()
        && s.bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}

fn list<T: AsRef<str>>(items: &[T]) -> String {
    if items.is_empty() {
        return "none".into();
    }
    items
        .iter()
        .map(AsRef::as_ref)
        .collect::<Vec<_>>()
        .join(", ")
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn schema() -> Compiled {
        serde_json::from_value::<Schema>(json!({
            "sections": {
                "hero": {
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "type": "object",
                    "properties": { "title": { "type": "string", "field": "text" } },
                    "required": ["title"],
                    "additionalProperties": false
                },
                "text": { "type": "object" }
            },
            "globals": [{ "slug": "home", "path": "/", "sections": ["hero", "text"] }],
            "collections": [{ "slug": "blog", "sections": ["text"] }]
        }))
        .unwrap()
        .compile()
        .unwrap_or_else(|problems| panic!("{problems:?}"))
    }

    fn sections(value: serde_json::Value) -> Vec<Section> {
        serde_json::from_value(value).unwrap()
    }

    #[test]
    fn valid_entries_pass() {
        let schema = schema();
        let home = sections(json!([{ "name": "hero", "data": { "title": "Hi" } }]));
        assert!(schema.check("home", &home).is_empty());
        let post = sections(json!([{ "name": "text", "data": {} }]));
        assert!(schema.check("blog/hello-world", &post).is_empty());
    }

    #[test]
    fn problems_name_the_section_and_field() {
        let schema = schema();
        let home = sections(json!([
            { "name": "hero", "data": { "title": 1 } },
            { "name": "logos", "data": {} }
        ]));
        assert_eq!(
            schema.check("home", &home),
            [
                "sections[0] (hero) /title: 1 is not of type \"string\"",
                "sections[1]: \"logos\" is not allowed in \"home\"; allowed: hero, text",
            ]
        );
        assert_eq!(
            schema.check("blog/Hello", &[]),
            ["\"blog/Hello\" is not in the schema; globals: home; collection items: blog/<name>"]
        );
    }

    #[test]
    fn invalid_schemas_are_refused() {
        let problems = serde_json::from_value::<Schema>(json!({
            "sections": { "Hero": { "type": "nope" } },
            "globals": [{ "slug": "home", "sections": ["hero"] }, { "slug": "home", "sections": [] }]
        }))
        .unwrap()
        .compile()
        .err()
        .unwrap();
        assert_eq!(problems.len(), 4, "{problems:?}");
    }
}
