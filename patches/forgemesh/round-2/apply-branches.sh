#!/usr/bin/env bash
# Recreate the round 2 ForgeMesh topic branches from the patch folders next to this script.
#
# Each folder is one branch (and one pull request). The branches are stacked:
# every branch starts from the previous one, the first from upstream main 3dc1342
# (the merge of the round 1 pull requests #5-#11).
#
# Usage:
#   apply-branches.sh <ForgeMesh clone> [--signoff] [--reset-author] [--push <remote>]
#
#   --signoff       add your Signed-off-by trailer to every commit (upstream requires DCO)
#   --reset-author  make your git identity the author of every commit
#   --push <remote> push every branch to <remote> (for example your fork) afterwards
set -euo pipefail

usage() {
  echo "usage: $0 <ForgeMesh clone> [--signoff] [--reset-author] [--push <remote>]" >&2
  exit 2
}

[ $# -ge 1 ] || usage
repo=$1
shift
signoff=""
reset_author=0
push_remote=""
while [ $# -gt 0 ]; do
  case $1 in
    --signoff) signoff="--signoff" ;;
    --reset-author) reset_author=1 ;;
    --push)
      [ $# -ge 2 ] || usage
      push_remote=$2
      shift
      ;;
    *) usage ;;
  esac
  shift
done

here=$(cd "$(dirname "$0")" && pwd)
base=3dc134214b293fa6faa09bc8b997f642067bffd3

# folder:branch, in stacking order
topics="
01-governance-preview-status:cursor/governance-preview-status-b108
02-p1-scheduler-allocation:cursor/p1-scheduler-allocation-b108
03-p1-workflow-execution:cursor/p1-workflow-execution-b108
04-p1-runtime-launcher-e2e:cursor/p1-runtime-launcher-e2e-b108
05-p1-plugin-supply-chain:cursor/p1-plugin-supply-chain-b108
"

cd "$repo"
if ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  echo "base commit $base is missing; fetch upstream main first" >&2
  echo "  git fetch https://github.com/Mekoforge/ForgeMesh.git main" >&2
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "the working tree of $repo has uncommitted changes" >&2
  exit 1
fi
for entry in $topics; do
  branch=${entry#*:}
  if git rev-parse -q --verify "refs/heads/$branch" >/dev/null; then
    echo "branch $branch already exists; delete it or use another clone" >&2
    exit 1
  fi
done

me="$(git config user.name) <$(git config user.email)>"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

parent=$base
for entry in $topics; do
  dir=${entry%%:*}
  branch=${entry#*:}
  mkdir "$work/$dir"
  for patch in "$here/$dir"/*.patch; do
    if [ "$reset_author" = 1 ]; then
      awk -v me="$me" 'NR == 2 && /^From: / { print "From: " me; next } { print }' \
        "$patch" >"$work/$dir/$(basename "$patch")"
    else
      cp "$patch" "$work/$dir/"
    fi
  done
  git checkout -q -b "$branch" "$parent"
  git am -q --3way $signoff "$work/$dir"/*.patch
  echo "$branch: $(git rev-list --count "$parent..$branch") commits on $(git rev-parse --short "$parent")"
  parent=$branch
done

if [ -n "$push_remote" ]; then
  for entry in $topics; do
    git push -u "$push_remote" "${entry#*:}"
  done
fi
