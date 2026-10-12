// Posts or updates one pull request comment per preview package.
//
// Each preview workflow publishes one package with
// `pkg-pr-new publish --comment=off --json=<file>` and then runs this script
// through actions/github-script. The comment for a package carries a hidden
// marker, so a new push or a rerun replaces only that package's comment.

const fs = require('fs');

module.exports = async ({github, context, core}) => {
  const pullRequest = context.payload.pull_request;
  if (!pullRequest) {
    core.info('Not a pull request event; no comment to post.');
    return;
  }

  const {packages = []} = JSON.parse(
    fs.readFileSync(process.env.PREVIEW_JSON, 'utf8'),
  );
  if (packages.length === 0) {
    core.warning('pkg-pr-new did not report any published package.');
    return;
  }

  const {owner, repo} = context.repo;
  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pullRequest.number,
    per_page: 100,
  });

  for (const {name, url} of packages) {
    const marker = `<!-- pkg-pr-new-preview:${name} -->`;
    const sha = url.slice(url.lastIndexOf('@') + 1);
    const body = [
      marker,
      `**\`${name}\` preview** for commit ${sha.slice(0, 7)}`,
      '',
      '```sh',
      `npm i ${url}`,
      '```',
      '',
      `Published by [this workflow run](${runUrl}). New pushes and reruns update this comment.`,
    ].join('\n');

    const existing = comments.find(
      comment => comment.user?.type === 'Bot' && comment.body?.includes(marker),
    );
    if (existing) {
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existing.id,
        body,
      });
      core.info(`Updated the ${name} preview comment.`);
    } else {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: pullRequest.number,
        body,
      });
      core.info(`Created the ${name} preview comment.`);
    }
  }
};
