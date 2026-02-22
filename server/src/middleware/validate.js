// This middleware validates incoming requests to ensure they meet expected criteria.
// joi is used for schema validation, which allows us to define the structure of the expected data and automatically check if the incoming data matches that structure.
// If the validation fails, we return a 400 Bad Request response with details about the validation errors.

import Joi from 'joi';


const userSchema = Joi.object({
    first_name: Joi.string().pattern(/^[a-zA-Z\s'-]+$/).min(2).max(30).required().messages({'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes.'}),
    last_name: Joi.string().pattern(/^[a-zA-Z\s'-]+$/).min(2).max(30).required().messages({ 'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes.' }),
    email: Joi.string().email().required(),
    gender: Joi.string().valid('Male', 'Female', 'Non-Binary').required(),
    status: Joi.string().valid('Active', 'Inactive').default('Active')
});


function validateRequest(req, res, next) {
    const { error } = userSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            message: error.details.map(detail => detail.message)[0] ||'Validation failed',
            details: error.details.map(detail => detail.message)
        });
    }
    next();
};

export {
    validateRequest,
    userSchema
};