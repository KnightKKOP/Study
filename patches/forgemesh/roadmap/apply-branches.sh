#!/usr/bin/env bash
# Recreate the ForgeMesh roadmap documentation branch from the patch folder next to this script.
#
# The folder is one branch (and one pull request) on upstream main 871cf9b
# (the merge of the round 3 pull requests #17-#23).
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
base=871cf9b0c6ce959907df72886f0b6f8cae04ec15

# folder:branch, in stacking order
topics="
01-docs-roadmap:cursor/docs-roadmap-b108
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
