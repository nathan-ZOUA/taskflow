import { Router } from 'express'
import { create, getById, list, remove, stats, update } from '../controllers/tasks.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

const tasksRouter = Router()
tasksRouter.use(requireAuth)
tasksRouter.get('/stats', stats)
tasksRouter.get('/', list)
tasksRouter.post('/', create)
tasksRouter.get('/:id', getById)
tasksRouter.put('/:id', update)
tasksRouter.delete('/:id', remove)

export default tasksRouter
