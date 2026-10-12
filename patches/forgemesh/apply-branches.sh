#!/usr/bin/env bash
# Recreate the ForgeMesh topic branches from the patch folders next to this script.
#
# Each folder is one branch (and one pull request). The branches are stacked:
# every branch starts from the previous one, the first from upstream main 5a0be13.
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
base=5a0be13fcd506d3e61454e14bfc1a4a6330304c2

# folder:branch, in stacking order
topics="
01-p0-correctness-fixes:cursor/p0-correctness-fixes-b108
02-p0-auth-tenant-binding:cursor/p0-auth-tenant-binding-b108
03-p0-controller-loop:cursor/p0-controller-loop-b108
04-p1-inference-routing:cursor/p1-inference-routing-b108
05-p1-gateway-hardening:cursor/p1-gateway-hardening-b108
"

cd "$repo"
if ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  echo "base commit $base is missing; fetch upstream main first" >&2
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
