#!/usr/bin/env bash
# Recreate the round 3 ForgeMesh topic branches from the patch folders next to this script.
#
# Each folder is one branch (and one pull request). The branches are stacked:
# every branch starts from the previous one, the first from upstream main c5b7f76
# (the merge of the round 2 pull requests #12-#16).
#
# The last branch formats the repository with ruff format. Its final commit lists that
# formatting commit in .git-blame-ignore-revs; the hash only exists once the patches are
# applied in your clone, so this script creates that commit itself.
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
base=c5b7f768a6f7bef757896f5e154f206a8c373814
format_subject="style: format the repository with ruff format"

# folder:branch, in stacking order
topics="
01-p1-api-contract-completion:cursor/p1-api-contract-completion-b108
02-p1-update-and-health:cursor/p1-update-and-health-b108
03-p1-cli-over-http:cursor/p1-cli-over-http-b108
04-p1-outbox-audit:cursor/p1-outbox-audit-b108
05-p2-observability-metrics:cursor/p2-observability-metrics-b108
06-p2-ci-deploy-hardening:cursor/p2-ci-deploy-hardening-b108
07-p2-ruff-format:cursor/p2-ruff-format-b108
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

# List the formatting commit of the current branch in .git-blame-ignore-revs and commit it.
blame_ignore_commit() {
  local parent=$1 branch=$2 fmt
  fmt=$(git log --format=%H --fixed-strings --grep="$format_subject" "$parent..$branch")
  if [ -z "$fmt" ] || [ "$(printf '%s\n' "$fmt" | wc -l)" -ne 1 ]; then
    echo "expected exactly one \"$format_subject\" commit on $branch" >&2
    exit 1
  fi
  cat >.git-blame-ignore-revs <<EOF
# 只改格式、不改行为的提交。GitHub 的 blame 视图自动跳过这里列出的提交；
# 本地执行 git config blame.ignoreRevsFile .git-blame-ignore-revs 之后，git blame 同样跳过。

# $format_subject
$fmt
EOF
  git add .git-blame-ignore-revs
  git commit -q $signoff -m "chore: skip the ruff format commit in git blame" -m "List the commit that formatted the repository in .git-blame-ignore-revs,
so that the blame view of GitHub, and git blame with
blame.ignoreRevsFile set, attribute each line to the commit that last
changed what it does."
}

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
  if [ "$dir" = 07-p2-ruff-format ]; then
    blame_ignore_commit "$parent" "$branch"
  fi
  echo "$branch: $(git rev-list --count "$parent..$branch") commits on $(git rev-parse --short "$parent")"
  parent=$branch
done

if [ -n "$push_remote" ]; then
  for entry in $topics; do
    git push -u "$push_remote" "${entry#*:}"
  done
fi
