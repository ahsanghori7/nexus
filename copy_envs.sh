#!/bin/sh

mkdir my_envs
mkdir my_envs/account_service
mkdir my_envs/app.c-link
mkdir my_envs/document_service
mkdir my_envs/framework
mkdir my_envs/project_service
mkdir my_envs/react-service

cp  account_service/.env my_envs/account_service
cp  app.c-link/.env my_envs/app.c-link
cp  document_service/.env my_envs/document_service
cp  framework/.env my_envs/framework
cp  project_service/.env my_envs/project_service

cp  react-service/.npmrc my_envs/react-service
cp  react-service/config.json my_envs/react-service
cp  react-service/demo.v2.json my_envs/react-service
cp  react-service/staging.v2.json my_envs/react-service
cp  react-service/uat.v2.json my_envs/react-service
cp  react-service/production.v2.json my_envs/react-service
cp  react-service/production.anz.json my_envs/react-service
