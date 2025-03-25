const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

const {
  DB_HOST,
  DB_NAME,
  DB_USER,
  DB_PASS,
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  AWS_REGION = 'us-east-1',
} = process.env;

const cognito = new AWS.CognitoIdentityServiceProvider({ region: AWS_REGION });

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { cpf, senha } = body;

    if (!cpf || !senha) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'CPF e senha são obrigatórios.' }),
      };
    }

    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });

    const [rows] = await connection.execute(
      'SELECT email FROM clientes WHERE id = ?',
      [cpf]
    );

    await connection.end();

    if (rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'CPF não encontrado no banco.' }),
      };
    }

    const email = rows[0].email;

    const authResult = await cognito
      .adminInitiateAuth({
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        ClientId: COGNITO_CLIENT_ID,
        UserPoolId: COGNITO_USER_POOL_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: senha,
        },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login realizado com sucesso',
        tokens: authResult.AuthenticationResult,
      }),
    };
  } catch (error) {
    console.error('Erro na Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erro ao autenticar via CPF',
        detalhes: error.message,
      }),
    };
  }
};
