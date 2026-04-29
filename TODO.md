# Validation Regex Implementation TODO

## Steps:
- [x] Step 1: Create TODO.md (current)
- [x] Step 2: Update src/pages/Register.tsx with validation logic, states, functions, input handlers, error displays, and form validation
- [x] Step 3: Update src/pages/Login.tsx similarly
- [x] Step 4: Test forms and mark complete
- [ ] Step 5: attempt_completion

## Plan Summary:
- Add email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Strong password regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`
- Client-side validation on blur/change/submit
- Error displays under inputs (rose theme)
- Prevent submit if invalid
