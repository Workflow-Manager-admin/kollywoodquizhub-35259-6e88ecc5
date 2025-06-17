#!/bin/bash
cd /home/kavia/workspace/code-generation/kollywoodquizhub-35259-6e88ecc5/kollywoodquizhub
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

