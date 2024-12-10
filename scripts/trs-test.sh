#!/bin/bash
echo "Starting test script"

# Default sleep duration
DEFAULT_SLEEP=40

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "No argument provided. Using default sleep duration: $DEFAULT_SLEEP seconds."
  sleep $DEFAULT_SLEEP
else
  # Validate the input to ensure it's a positive number
  if [[ "$1" =~ ^[0-9]+$ ]]; then
    echo "Sleeping for $1 seconds."
    sleep $1
  else
    echo "Invalid input: '$1' is not a positive number. Exiting."
    exit 1
  fi
fi

echo "Done sleeping!"
