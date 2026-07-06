/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 * 
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *         icon:
 *           type: string
 *         isSystem:
 *           type: boolean
 * 
 * /categories:
 *   get:
 *     summary: Get categories
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *     responses:
 *       200:
 *         description: List of categories
 *   
 *   post:
 *     summary: Create a custom category
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created category
 * 
 * /categories/{id}:
 *   patch:
 *     summary: Update custom category
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated category
 *       403:
 *         description: System categories are read-only
 * 
 *   delete:
 *     summary: Delete custom category
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted successfully
 *       403:
 *         description: System categories are read-only
 */
