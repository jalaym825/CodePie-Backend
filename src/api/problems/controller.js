const router = require('express').Router();
const zodValidator = require("@middlewares/zodValidator");
const isAuthenticated = require('@middlewares/isAuthenticated');
const isAdmin = require('@middlewares/isAdmin');
const problemSchema = require("./dtos/create-problem-dto");
const createProblem = require("./services/createProblem");
const addTestcases = require("./services/addTestcases");
const addTestcasesSchema = require("./dtos/add-testcases-schema");

router.post('/', isAuthenticated, isAdmin, zodValidator(problemSchema), createProblem);
router.post('/testcases', zodValidator(addTestcasesSchema), addTestcases);

module.exports = router;