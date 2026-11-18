# headcode serve in a container (self-hosted, e.g. Coolify). Needs DATABASE_URL;
# migrations run on start.
FROM rust:1-bookworm AS build
WORKDIR /app
COPY . .
# rust-toolchain.toml pins the version; rustup installs it here.
RUN cargo build --release --bin headcode

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/headcode /usr/local/bin/headcode
ENV HOST=0.0.0.0 PORT=3080
EXPOSE 3080
CMD ["headcode", "serve"]
