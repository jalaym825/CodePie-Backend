const router = require('express').Router();
const zodValidator = require("@middlewares/zodValidator");
const isAuthenticated = require('@middlewares/isAuthenticated');
const isAdmin = require('@middlewares/isAdmin');
const problemSchema = require("./dtos/create-problem-dto");
const createProblem = require("./services/createProblem");
const addTestcases = require("./services/addTestcases");
const addTestcasesSchema = require("./dtos/add-testcases-schema");
const getAllProblems = require("./services/getAllProblems");
const getProblemById = require("./services/getProblemById");
const updateProblem = require("./services/updateProblem");
const updateProblemDto = require("./dtos/update-problem-dto");
const getPracticeProblems = require('./services/getPracticeProblems');
const getPracticeProblemsById = require('./services/getPracticeProblemsById');
const getProblemSolutions = require('./services/getProblemSolutions');
const getProblemSolutionsById = require('./services/getProblemSolutionById');
const generateQuestion = require("./services/generateQuestion")

router.post('/testcases', zodValidator(addTestcasesSchema), addTestcases);
router.post('/', isAuthenticated, isAdmin, zodValidator(problemSchema), createProblem);

router.get('/', getAllProblems);

router.get("/practice", getPracticeProblems);

router.get('/:id', getProblemById);

router.put('/:id', isAuthenticated, isAdmin, zodValidator(updateProblemDto), updateProblem);

router.get("/practice/:problemId", isAuthenticated, getPracticeProblemsById);
router.get("/solutions/:problemId", isAuthenticated, getProblemSolutions);
router.get("/:problemId/solustion/:solutionId", isAuthenticated, getProblemSolutionsById);

router.post("/generate", isAuthenticated, isAdmin, generateQuestion);

module.exports = router;