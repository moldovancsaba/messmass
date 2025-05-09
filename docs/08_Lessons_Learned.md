# Lessons Learned - messmass

## Git Push Incident – Oversized File

### Summary
An Electron binary file exceeding GitHub’s 100MB limit blocked deployment. We resolved this via `.gitignore`, `.git filter-repo`, and clean repo initialization.
