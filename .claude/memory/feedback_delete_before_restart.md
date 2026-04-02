---
name: Delete meals before restart
description: Always delete today's MongoDB meals before telling user to restart the backend
type: feedback
---

Always run the delete-today-meals script before telling the user to restart the backend after a calorie/logging bug fix.

**Why:** Wrong meal entries accumulate in MongoDB from previous buggy runs and corrupt the daily totals. The user expects a clean slate each time.

**How to apply:** Any time a backend change affects how meals are saved or calculated, run `"/c/Program Files/nodejs/node.exe" "c:\Users\User\Desktop\Projects\cal-app\cal_app\backend\scripts\delete-today-meals.js"` first, confirm deletion count, then tell the user to restart.
