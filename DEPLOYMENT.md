# Deployment & CD Guide (Phase 6)

This document explains how to configure Continuous Deployment to Kubernetes, perform rolling updates or blue‑green deployments, test them, and calculate resource requirements.

Prerequisites
- Kubernetes cluster (minikube / kind / cloud)
- kubectl configured to target cluster
- Docker registry with image already pushed (GHCR / Docker Hub)
- GitHub Actions secret: KUBE_CONFIG_DATA (base64 kubeconfig) or set up `kubectl` access in runner
- Optional: DOCKERHUB_USERNAME / DOCKERHUB_TOKEN for Docker Hub pushes

CI/CD overview
- Build image, push to registry
- Deploy to cluster:
  - Rolling update: `kubectl set image` on deployment (ensures zero downtime using RollingUpdate strategy)
  - Blue‑green: deploy new deployment (suffix), verify, switch Service selector to new deployment, and remove old deployment

How to test locally (minikube)
1. Start minikube
   minikube start --memory=4096 --cpus=2
2. Load or build image into minikube:
   - If image already in remote registry: no action
   - To build locally and load:
     docker build -t ghcr.io/<OWNER>/<REPO>:dev .
     minikube image load ghcr.io/<OWNER>/<REPO>:dev
3. Ensure namespace exists:
   kubectl apply -f k8s/namespace.yaml
4. Create secret (if needed):
   kubectl -n cmss create secret generic mysql-credentials --from-literal=MYSQL_ROOT_PASSWORD=password --from-literal=MYSQL_DATABASE=complaint_management_system --from-literal=MYSQL_USER=root
5. Deploy:
   kubectl -n cmss apply -f k8s/deployment.yaml
   kubectl -n cmss apply -f k8s/service.yaml
   kubectl -n cmss apply -f k8s/hpa.yaml
6. Verify:
   kubectl -n cmss get pods,svc,deploy,hpa
   kubectl -n cmss rollout status deployment/cmss-deployment
   kubectl -n cmss port-forward svc/cmss-service 3000:3000
   curl http://localhost:3000/health

Rolling update (zero downtime)
- Locally:
  1. Build and push new image tag (or load into cluster)
  2. Update deployment image:
     kubectl -n cmss set image deployment/cmss-deployment cmss=ghcr.io/<OWNER>/<REPO>:vX.Y.Z --record
     kubectl -n cmss rollout status deployment/cmss-deployment
- CI (example): the CD workflow will call the same `kubectl set image` and wait for rollout.

Blue‑green deployment (manual test)
1. Deploy green version:
   - Copy k8s/deployment.yaml -> k8s/deployment-green.yaml (change metadata.name to cmss-deployment-green and label app=cmss-green)
   - Update image tag in green manifest
   kubectl -n cmss apply -f k8s/deployment-green.yaml
2. Verify green pods are Ready:
   kubectl -n cmss rollout status deployment/cmss-deployment-green
3. Switch Service to green by changing selector:
   kubectl -n cmss patch svc/cmss-service -p '{"spec":{"selector":{"app":"cmss-green"}}}'
4. Monitor traffic and metrics. If OK, delete old deployment:
   kubectl -n cmss delete deployment cmss-deployment
   Optionally rename green deployment to canonical name.

Autoscaling & HPA test
- Ensure metrics-server is installed
- Force CPU load or scale deployment replicas:
  kubectl -n cmss scale deployment/cmss-deployment --replicas=5
- Check HPA:
  kubectl -n cmss get hpa
  kubectl -n cmss describe hpa cmss-hpa

Smoke tests / verification
- After rollout:
  curl -sSf http://<SERVICE_IP>:3000/health
- API quick check:
  curl -sSf http://<SERVICE_IP>:3000/api/complaints | jq .

Resource calculation (example)
- Per-pod requests in deployment.yaml:
  requests.cpu = 250m (0.25 vCPU)
  requests.memory = 256Mi
- Simple formula:
  total_cpu_requests = replicas * requests.cpu
  total_memory = replicas * requests.memory
- Example sizing:
  baseline traffic -> 2 replicas → CPU 0.5 vCPU, Memory 512Mi
  peak traffic -> 10 replicas → CPU 2.5 vCPU, Memory 2.5Gi
- Add 20–30% buffer for system pods and headroom.

Monitoring & rollback
- Rollout history:
  kubectl -n cmss rollout history deployment/cmss-deployment
- Rollback:
  kubectl -n cmss rollout undo deployment/cmss-deployment

Useful commands
- kubectl -n cmss get all
- kubectl -n cmss describe pod <pod>
- kubectl -n cmss logs deployment/cmss-deployment
- kubectl -n cmss port-forward svc/cmss-service 3000:3000

CI testing tips
- Run integration tests against a test namespace using a temporary MySQL (job or service container).
- Use GitHub Actions `kubeconfig` secret to apply manifests in CI.
- Run smoke tests after deploy step: curl /health and invoke a few API endpoints.

Notes
- Replace image references with your registry (ghcr.io/OWNER/REPO:TAG).
- Keep secrets out of repo; use GitHub Secrets.
