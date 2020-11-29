const express = require('express');

const router = express.Router();
const { teamApi } = require('../api');

router.get('/', teamApi.getMembership);
router.get('/user/assignments', teamApi.getUserAssignments);
router.get('/assignments', teamApi.getSpecificAssignments);
router.get('/teams', teamApi.getTeamsOnSpace);
router.post('/', teamApi.addUserToTeam);
router.post('/update', teamApi.updateRole);
router.delete('/', teamApi.deleteUserFromTeam);
router.post('/assign', teamApi.addAssignment);
router.delete('/assign', teamApi.deleteAssignment);

module.exports = router;
