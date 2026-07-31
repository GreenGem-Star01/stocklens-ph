---
title: "Ingest failure: {{ workflow }}"
labels: ingest-failure
---

The scheduled workflow **{{ workflow }}** failed.

- Run: {{ repo.html_url }}/actions/runs/{{ runId }}
- Commit: {{ sha }}
- Triggered by: {{ eventName }}

Check the run logs, fix the underlying issue, then close this issue. If the
same workflow fails again before this is closed, this issue is reused rather
than duplicated.
