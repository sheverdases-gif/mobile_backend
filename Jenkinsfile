
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh '''
                    echo "=== PROJECT INFORMATION ==="
                    cat package.json

                    echo "=== NODE.JS SOURCE CHECK ==="
                    echo "Checking index.js syntax..."

                    if command -v node >/dev/null 2>&1; then
                        node --check index.js
                    else
                        echo "Node.js is not installed on Jenkins."
                        echo "Syntax check will be performed in the Node.js environment later."
                    fi
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    echo "=== PROJECT FILES ==="
                    test -f index.js
                    test -f package.json
                    test -f Dockerfile
                    test -f docker-compose.yml

                    echo "Required project files are present."
                '''
            }
        }
    }
}
