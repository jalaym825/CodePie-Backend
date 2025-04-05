const prisma = require("@utils/prisma");
const express = require('express');
const zodValidator = require("@middlewares/zodValidator");
const isAuthenticated = require('@middlewares/isAuthenticated');
const isAdmin = require('@middlewares/isAdmin');
const problemSchema = require("./dtos/create-problem-dto");
const addTestcasesSchema = require("./dtos/add-testcases-schema")
const createProblem = require("./services/createProblem");
const addTestcases = require("./services/addTestCases");
const getAllProblems = require("./services/getAllProblems");
const getProblemById = require("./services/getProblemById");
const getProblemSolustions = require("./services/getProblemSolutions");
const getProblemSolustionsById = require("./services/getProblemSolustionById");



const router = express.Router();


router.post('/testcases', zodValidator(addTestcasesSchema), addTestcases);
router.post('/', isAuthenticated, isAdmin, zodValidator(problemSchema), createProblem);
router.get('/', getAllProblems);
router.get('/:problemId', getProblemById);
// router.put('/:id', isAuthenticated, isAdmin, zodValidator(updateProblemDto), updateProblem);
router.get("/getSolution/:problemId",isAuthenticated,getProblemSolustions)
router.get("/getSolution/:problemId/solution/:solutionId",isAuthenticated,getProblemSolustionsById)


module.exports = router;
