# Taylor Goolsby

Hi, welcome to the source code behind my personal website where I host my public projects.

They are all hosted on a single EC2 instance and some of them are multiplayer.

## Repo Structure

* `package.json` - Contains the details for the kinds of `npm run` commands you can run.
* `src/mysql` - Contains code for running a MySQL server locally for development. Run using `npm run mysql`.
* `src/web` - Contains Next.JS code for the website served at [https://tgoolsby.to](https://tgoolsby.to). It is compiled into a `dist` bundle which is then bundled with the backend code, and served from the EC2 server. Static assets are uploaded to an S3 bucket.
* `src/backend` - Contains the backend code. It is a Node.js Express server. It maps the subdomain in the request to an express router which serves the appropriate project.
* `src/common` - Contains code for loading things that should be loaded for every node project.

This repo hosts the source code for multiple projects separated by subdomain. For any given project, the backend and frontend portions are split into the `backend` and `web` directories, respectively.

## Backend Structure

* There is a main `server.js` which sets up the express server which then sets up a route for each project separated by subdomain. This sets up the web serving for each project.
* Each project has backend specific code in the respective folder under `src/backend/src/project`.

## Frontend Structure

* The frontend `index.html` served at [https://tgoolsby.to](https://tgoolsby.to) displays a list of projects and allows navigation to each project's subdomain.
* The backend checks the subdomain of the request, and routes it to a router which serves a Next.JS project for that subdomain. So each project has its own Next.JS project which matches the glob `src/web-*/`.
* During bundling, all `web-*` projects are built, and the compiled files are placed in `dist/web-*` folders relative to `backend/src/server.js`. The express routers will serve the appropriate project based on the subdomain.
* When making a new project, besides copy-and-pasting a `web-*` folder, make sure to update `next-sitemap.config.js` with the subdomain of the new project, and update the `name` in the `package.json`.

## Running the Code

1. Clone the repository.
2. `cd tgoolsby.to`
3. `yarn` - installs everything
4. `npm start` - starts the backend server
5. `npm run start-web` - starts the web servers for each subdomain

Services will be started on these ports:

* `localhost:4000` - Express server
* `localhost:3306` - MySQL server (MySQL is automatically installed on mac)
* `localhost:5555` - Express server for looking at email templates during development.

If your MySQL server become corrupted, clean it using `npm run clean-sql`.

It is recommended to use something like [LocalCan](https://www.localcan.com/) to enable easy use of subdomains on localhost.
