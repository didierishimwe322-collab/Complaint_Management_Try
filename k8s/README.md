# Kubernetes deployment instructions (static reference)

# 1. Apply manifests (namespace, secret, deployment, service, hpa)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mysql-secret.yaml         # or create secret via kubectl create secret
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

# 2. Verify deployment rollout
kubectl -n cmss get pods -w
kubectl -n cmss rollout status deployment/cmss-deployment

# 3. Access the application
# a) If Service is LoadBalancer:
kubectl -n cmss get svc cmss-service
# Use external IP returned by the command: http://<EXTERNAL_IP>:3000/health

# b) If using NodePort (change service type) or port-forward:
kubectl -n cmss port-forward svc/cmss-service 3000:3000
# Then open http://localhost:3000/health

# 4. Rolling update with zero downtime
# Build and push new image to registry, then update deployment:
kubectl -n cmss set image deployment/cmss-deployment cmss=ghcr.io/<OWNER>/<REPO>:vX.Y.Z
# Check rollout:
kubectl -n cmss rollout status deployment/cmss-deployment
# Inspect history:
kubectl -n cmss rollout history deployment/cmss-deployment

# 5. Autoscaling
# Ensure metrics-server is installed in cluster.
# HPA will scale between minReplicas and maxReplicas based on CPU usage.
kubectl -n cmss get hpa

# 6. Resource calculation (example)
# Single pod requests: 0.25 CPU, 256Mi memory
# For N replicas required, allocate:
#   total_cpu_requests = N * 0.25
#   total_memory = N * 256Mi
# Example: 5 replicas -> CPU 1.25, Memory 1.25Gi
# Add 20-30% buffer for system pods and headroom.

# 7. Rollback (if needed)
kubectl -n cmss rollout undo deployment/cmss-deployment
