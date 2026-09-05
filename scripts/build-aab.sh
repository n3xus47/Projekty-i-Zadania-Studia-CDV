#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CRED_DIR="$ROOT/credentials"
KEYSTORE="$CRED_DIR/cdv-dzis-upload.jks"
PROPS="$CRED_DIR/keystore.properties"
ALIAS="cdv-dzis"

mkdir -p "$CRED_DIR"

if [[ ! -f "$KEYSTORE" || ! -f "$PROPS" ]]; then
  PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  keytool -genkeypair -v \
    -storetype JKS \
    -keystore "$KEYSTORE" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$PASS" \
    -keypass "$PASS" \
    -dname "CN=CDV Dzis, OU=CDV, O=221 studios, L=Poznan, ST=Wielkopolskie, C=PL"

  cat > "$PROPS" <<EOF
storeFile=$KEYSTORE
storePassword=$PASS
keyAlias=$ALIAS
keyPassword=$PASS
EOF
  chmod 600 "$KEYSTORE" "$PROPS"
  echo "Created Play upload keystore in credentials/ (do not lose this file)."
fi

# shellcheck disable=SC1090
set -a
# Convert properties into env for Gradle
STORE_FILE="$(sed -n 's/^storeFile=//p' "$PROPS")"
STORE_PASSWORD="$(sed -n 's/^storePassword=//p' "$PROPS")"
KEY_ALIAS="$(sed -n 's/^keyAlias=//p' "$PROPS")"
KEY_PASSWORD="$(sed -n 's/^keyPassword=//p' "$PROPS")"
set +a

if [[ ! -d "$ROOT/android" ]]; then
  CI=1 npx expo prebuild --platform android --non-interactive
fi

cd "$ROOT/android"
./gradlew bundleRelease --no-daemon \
  "-Pandroid.injected.signing.store.file=$STORE_FILE" \
  "-Pandroid.injected.signing.store.password=$STORE_PASSWORD" \
  "-Pandroid.injected.signing.key.alias=$KEY_ALIAS" \
  "-Pandroid.injected.signing.key.password=$KEY_PASSWORD"

AAB_OUT="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
if [[ ! -f "$AAB_OUT" ]]; then
  echo "ERROR: AAB not found at $AAB_OUT" >&2
  exit 1
fi

NODE_BIN="${NODE_BIN:-node}"
APP_VERSION="$("$NODE_BIN" -e "console.log(require(process.argv[1]).expo.version)" "$ROOT/app.json")"
VERSIONED_AAB="$ROOT/CDV-Dzis-$APP_VERSION.aab"
cp -f "$AAB_OUT" "$VERSIONED_AAB"
cp -f "$AAB_OUT" "$ROOT/CDV-Dzis.aab"
echo "Done: $(basename "$VERSIONED_AAB") ($(du -h "$VERSIONED_AAB" | cut -f1))"
