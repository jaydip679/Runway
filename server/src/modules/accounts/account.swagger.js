/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Account management endpoints
 * 
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [BANK, CASH, WALLET, CREDIT_CARD]
 *         currentBalance:
 *           type: string
 *         currency:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 * /accounts:
 *   get:
 *     summary: Get user accounts
 *     tags: [Accounts]
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
 *     responses:
 *       200:
 *         description: List of accounts
 *   
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
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
 *               - currentBalance
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [BANK, CASH, WALLET, CREDIT_CARD]
 *               currentBalance:
 *                 type: number
 *               currency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created account
 * 
 * /accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account data
 *       404:
 *         description: Account not found
 * 
 *   patch:
 *     summary: Update account
 *     tags: [Accounts]
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
 *                 enum: [BANK, CASH, WALLET, CREDIT_CARD]
 *               currentBalance:
 *                 type: number
 *               currency:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated account
 * 
 *   delete:
 *     summary: Delete account
 *     tags: [Accounts]
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
 */
