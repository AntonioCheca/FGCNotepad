# FGCNotepad

FGCNotepad is a forum-wiki hybrid platform designed to analyze fighting games from a Game Theory perspective. It helps players break down matchups, explore optimal combos and oki setups, and structure in-depth strategic thinking. The platform is currently focused on Street Fighter 6, with plans for extensibility in the future.
### 🌐 Project Structure

Backend made in Symfony (PHP) with frontend made in Next.js, and database in Postgresql.

## 🚀 Getting Started

### 🔧 One-Time Setup

Clone the repo and run:

```bash
make up
make composer-install
make create-jwt-keys
make create-test-database
make migrate
make migrate-test
```

You can check the backend works by running the tests made in PHPUnit

Once running, access the frontend via http://localhost:3000.

### 🧰 Makefile Commands

Command	Description

`make up` Start containers and build the project

`make down` Stop and remove all containers

`make logs` Show and follow logs from all services

`make composer-install`	Install PHP dependencies via Composer

`make create-jwt-keys`	Generate JWT keys for Symfony auth

`make migrate`	Run backend DB migrations

`make migrate-test`	Run test DB migrations

`make create-test-database`	Create a PostgreSQL database for test purposes

`make bash`	Open a bash shell inside the backend container

`make psql`	Access PostgreSQL CLI inside the container

## ✍️ Contribution Guidelines

We follow Clean Code principles:

 - Descriptive variable and class names

 - Short, focused functions

 - Low indentation levels

 - Self-documenting code, no comments unless justified

Pull Requests

 - Fork the repository
 - Create a feature branch
 - Submit a pull request for review
 - Backend code should include tests (PHPUnit) where applicable
 - Documentation is optional if the code is clean
 - No front-end test suite is currently in place

## 🧭 Roadmap
### ✅ Current Features
 - Create and edit posts using a Lexical editor
 - Tag moves directly inside posts
 - Model and solve payoff tables with a Mixed Equilibrium optimiser
 - Define and analyze in-game scenarios

### 🛣️ In Progress / Planned

 - Excel-like payoff matrix input UX
 - Secondary table referencing for scenario trees
 - Improved modeling for combos
 - Automatically suggest optimal combo paths starting from a selected move
 - Support for hit-confirmability (whether something is a read or can be reacted to)
 - Add Drive Gauge and Meter as resources in analysis
 - Support for moderator roles to help with content review
 - Replay integration: automatically extract data from uploaded match videos

## 📜 License

MIT License

## Issues 
For bugs, feature requests, or discussion:

Open a GitHub Issue

Use GitHub Discussions

Or reach out to us through the Discord
