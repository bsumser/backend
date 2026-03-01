## Table of Contents

- [Description](#description)
- [Tech Stack](#techstack)
- [CI/CD](#CI/CD)
- [Tests](#tests)
- [SSL Cert](#sslcert)
- [Credits](#credits)

## Description

## Tech Stack

## CI/CD

## Tests

Test colorization from grc.

## SSL Certification

## Optimizations
Postgres uses a module called pg_trgm to break your card names into these small chunks. When you perform a search using ILIKE or // %, the database doesn't have to scan all 650,000 rows one by one (a "Sequential Scan"). Instead, it looks up the trigrams in the index to find matching cards instantly.

## Credits

https://earthly.dev/blog/golang-chi/