#!/usr/bin/env bash
set -euo pipefail

K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-all}"

usage() {
  echo "Usage:"
  echo "  $0            # apply all manifests (ordered)"
  echo "  $0 <file>     # apply single file (supports names in k8s/, auto-add .yaml)"
  exit 1
}

apply_ordered_all() {
  echo "Applying namespace..."
  kubectl apply -f "${K8S_DIR}/namespace.yaml"
  # wait briefly for namespace to be created
  for i in {1..10}; do
    if kubectl get namespace cmss >/dev/null 2>&1; then break; fi
    sleep 1
  done

  echo "Applying namespaced resources..."
  kubectl apply -n cmss -f "${K8S_DIR}/mysql-secret.yaml" --ignore-not-found
  kubectl apply -n cmss -f "${K8S_DIR}/deployment.yaml" --ignore-not-found
  kubectl apply -n cmss -f "${K8S_DIR}/service.yaml" --ignore-not-found
  kubectl apply -n cmss -f "${K8S_DIR}/hpa.yaml" --ignore-not-found
  kubectl apply -n cmss -f "${K8S_DIR}/ingress.yaml" --ignore-not-found
  echo "All manifests applied."
}

# If user requested 'all'
if [[ "$TARGET" == "all" ]]; then
  apply_ordered_all
  exit 0
fi

# Try user-supplied path as-is
if [[ -f "$TARGET" ]]; then
  kubectl apply -f "$TARGET"
  exit $?
fi

# Try inside k8s directory
if [[ -f "${K8S_DIR}/${TARGET}" ]]; then
  kubectl apply -f "${K8S_DIR}/${TARGET}"
  exit $?
fi

# Try adding .yaml extension
for ext in yaml yml; do
  if [[ -f "${TARGET}.${ext}" ]]; then
    kubectl apply -f "${TARGET}.${ext}"
    exit $?
  fi
  if [[ -f "${K8S_DIR}/${TARGET}.${ext}" ]]; then
    kubectl apply -f "${K8S_DIR}/${TARGET}.${ext}"
    exit $?
  fi
done

# Suggest closest matches from k8s/ using Python difflib (best-effort)
echo "Error: file not found: '$TARGET'"
echo
echo "Available files in ${K8S_DIR}:"
ls -1 "${K8S_DIR}" || true
echo
python3 - <<PY || true
import difflib, sys, os
k8s = os.listdir("$K8S_DIR") if os.path.isdir("$K8S_DIR") else []
matches = difflib.get_close_matches(sys.argv[1], k8s, n=5, cutoff=0.4)
if matches:
    print("Did you mean:")
    for m in matches:
        print("  - " + m)
else:
    print("No close matches found.")
PY
echo
echo "Tip: common mistake is using .yam instead of .yaml — try:"
echo "  ./k8s/apply-manifests.sh service.yaml"
echo "Or apply all manifests in correct order:"
echo "  ./k8s/apply-manifests.sh"
exit 1
