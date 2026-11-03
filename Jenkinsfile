
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh '''
                    set -e

                    NODE_VERSION="20.19.5"
                    NODE_DIR="$WORKSPACE/.tools/node-v${NODE_VERSION}-linux-x64"

                    echo "=== INSTALL NODE.JS ==="

                    mkdir -p "$WORKSPACE/.tools"

                    if [ ! -x "$NODE_DIR/bin/node" ]; then
                        curl -fL \
                          "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
                          -o "$WORKSPACE/node.tar.gz"

                        tar -xzf "$WORKSPACE/node.tar.gz" -C "$WORKSPACE/.tools"
                        rm "$WORKSPACE/node.tar.gz"
                    fi

                    export PATH="$NODE_DIR/bin:$PATH"

                    echo "=== VERSIONS ==="
                    node --version
                    npm --version

                    echo "=== INSTALL DEPENDENCIES ==="
                    npm ci

                    echo "=== CHECK SOURCE CODE ==="
                    node --check index.js
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    set -e

                    NODE_DIR="$WORKSPACE/.tools/node-v20.19.5-linux-x64"
                    export PATH="$NODE_DIR/bin:$PATH"

                    echo "=== START MOBILE API ==="

                    DB_HOST=127.0.0.1 \
                    DB_USER=test \
                    DB_PASSWORD=test \
                    DB_NAME=test \
                    npm start > app.log 2>&1 &

                    APP_PID=$!
                    trap 'kill "$APP_PID" 2>/dev/null || true' EXIT

                    echo "=== CHECK API HEALTH ==="

                    i=1
                    while [ "$i" -le 10 ]; do
                        if curl -fsS http://127.0.0.1:3000/api/health > health.json; then
                            break
                        fi

                        sleep 2
                        i=$((i + 1))
                    done

                    cat health.json

                    grep -q '"status":"OK"' health.json

                    echo "API health check passed."
                '''
            }
        }
    }
}
