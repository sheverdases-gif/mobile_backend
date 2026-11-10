
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

                    mkdir -p "$WORKSPACE/.tools"

                    if [ ! -x "$NODE_DIR/bin/node" ]; then
                        curl -fL \
                          "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
                          -o "$WORKSPACE/node.tar.gz"

                        tar -xzf "$WORKSPACE/node.tar.gz" -C "$WORKSPACE/.tools"
                        rm "$WORKSPACE/node.tar.gz"
                    fi

                    export PATH="$NODE_DIR/bin:$PATH"

                    node --version
                    npm --version

                    npm ci
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

                    DB_HOST=127.0.0.1 \
                    DB_USER=test \
                    DB_PASSWORD=test \
                    DB_NAME=test \
                    npm start > app.log 2>&1 &

                    APP_PID=$!
                    trap 'kill "$APP_PID" 2>/dev/null || true' EXIT

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

        stage('Deploy') {
            agent {
                label 'mobile-backend'
            }

            steps {
                checkout scm

                powershell '''
                    $ErrorActionPreference = "Stop"

                    Set-Location $env:WORKSPACE

                    $envFile = "C:\\docker_labs_new\\mobile_backend\\.env"

                    if (-not (Test-Path $envFile)) {
                        throw "Local .env file was not found."
                    }

                    docker compose -p mobile_backend --env-file $envFile up -d --build --no-deps app

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker Compose deployment failed."
                    }

                    $healthy = $false

                    for ($i = 1; $i -le 10; $i++) {
                        try {
                            $response = Invoke-RestMethod `
                                -Uri "http://localhost:8083/api/health" `
                                -TimeoutSec 5

                            if ($response.status -eq "OK") {
                                Write-Host "API health check passed."
                                $response | ConvertTo-Json
                                $healthy = $true
                                break
                            }
                        }
                        catch {
                            Write-Host "Waiting for API... attempt $i"
                        }

                        Start-Sleep -Seconds 3
                    }

                    if (-not $healthy) {
                        throw "API health check failed after deployment."
                    }
                '''
            }
        }

        stage('CRUD verification') {
            agent {
                label 'mobile-backend'
            }

            steps {
                powershell '''
                    $ErrorActionPreference = "Stop"

                    $testUserId = $null
                    $testEmail = "jenkins-" + [guid]::NewGuid().ToString("N") + "@example.com"

                    try {
                        Write-Host "=== CREATE TEST USER ==="

                        $createBody = @{
                            name = "Jenkins Test User"
                            email = $testEmail
                        } | ConvertTo-Json

                        $created = Invoke-RestMethod `
                            -Uri "http://localhost:8083/api/users" `
                            -Method Post `
                            -ContentType "application/json" `
                            -Body $createBody

                        $testUserId = [int]$created.user.id

                        if ($created.message -ne "User created successfully") {
                            throw "POST verification failed."
                        }

                        Write-Host "POST passed. User ID: $testUserId"

                        Write-Host "=== CHECK GET ==="

                        $users = Invoke-RestMethod `
                            -Uri "http://localhost:8083/api/users" `
                            -Method Get

                        $found = @($users.users | Where-Object {
                            $_.id -eq $testUserId
                        })

                        if ($found.Count -ne 1) {
                            throw "GET verification failed."
                        }

                        Write-Host "GET passed."

                        Write-Host "=== UPDATE TEST USER ==="

                        $updateBody = @{
                            name = "Jenkins Updated User"
                            email = $testEmail
                        } | ConvertTo-Json

                        $updated = Invoke-RestMethod `
                            -Uri "http://localhost:8083/api/users/$testUserId" `
                            -Method Put `
                            -ContentType "application/json" `
                            -Body $updateBody

                        if ($updated.user.name -ne "Jenkins Updated User") {
                            throw "PUT verification failed."
                        }

                        Write-Host "PUT passed."

                        Write-Host "=== VERIFY UPDATED USER ==="

                        $users = Invoke-RestMethod `
                            -Uri "http://localhost:8083/api/users" `
                            -Method Get

                        $found = @($users.users | Where-Object {
                            $_.id -eq $testUserId -and
                            $_.name -eq "Jenkins Updated User"
                        })

                        if ($found.Count -ne 1) {
                            throw "Updated user was not found."
                        }

                        Write-Host "Updated data verified."

                        Write-Host "=== DELETE TEST USER ==="

                        $deleted = Invoke-RestMethod `
                            -Uri "http://localhost:8083/api/users/$testUserId" `
                            -Method Delete

                        if ($deleted.message -ne "User deleted successfully") {
                            throw "DELETE verification failed."
                        }

                        $testUserId = $null

                        Write-Host "DELETE passed."

                        Write-Host "=== VERIFY DELETION ==="

                        $users = Invoke-RestMethod `
                            -Uri "http://localhost:8083/api/users" `
                            -Method Get

                        $found = @($users.users | Where-Object {
                            $_.id -eq [int]$deleted.user.id
                        })

                        if ($found.Count -ne 0) {
                            throw "Deleted user still exists."
                        }

                        Write-Host "CRUD verification completed successfully."
                    }
                    finally {
                        if ($null -ne $testUserId) {
                            Write-Host "=== CLEANUP TEST USER ==="

                            try {
                                Invoke-RestMethod `
                                    -Uri "http://localhost:8083/api/users/$testUserId" `
                                    -Method Delete | Out-Null

                                Write-Host "Temporary test record removed."
                            }
                            catch {
                                Write-Warning "Could not remove test record: $_"
                            }
                        }
                    }
                '''
            }
        }
    }
}
