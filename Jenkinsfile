
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Node.js tools') {
            steps {
                sh '''
                    echo "=== DOWNLOAD UTILITIES ==="
                    command -v curl || true
                    command -v wget || true
                    command -v tar || true
                    command -v xz || true

                    echo "=== NODE.JS DOWNLOAD CHECK ==="
                    curl -I -L --max-time 20 \
                        https://nodejs.org/dist/latest-v20.x/ || true
                '''
            }
        }
    }
}
