#!/bin/bash

node bin/deadSubsCleaner.js &
node bin/listenersController.js &
node bin/oldNotificationCleaner.js &

yarn start