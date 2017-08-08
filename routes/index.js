var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var path = require('path');
var AWS = require('aws-sdk');
var AmazonCognitoIdentity = require('amazon-cognito-identity-js');
var debug = require('debug')('CognitoDemo:router:index');

const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 1800;

// 認可POSTエンドポイント
router.post('/authorize', async (req, res, next) => {
    try {
        // POSTの本文を検証(cognitive identity idを取得できるかどうか)
        debug('payload:', req.body);
        AWS.config.region = 'ap-northeast-1';
        const cognitoIdentity = new AWS.CognitoIdentity();
        const getIdResponse = await cognitoIdentity.getId({
            // アカウントサービスにつき一意(環境変数での指定で問題なさそう)
            IdentityPoolId: 'ap-northeast-1:6a67f523-93c3-4766-b96f-6552f21abd8d',
            Logins: req.body.logins
        }).promise();
        debug('getIdResponse:', getIdResponse);

        // 検証に成功すれば、jsonwebtokenを生成
        jwt.sign(
            {
                state: req.body.state,
                scope: req.body.scope,
                logins: req.body.logins,
                client_id: req.body.client_id
            },
            '12345',
            {
                expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS
            },
            (err, encoded) => {
                if (err instanceof Error) {
                    next(err);
                } else {
                    res.json({
                        access_token: encoded,
                        token_type: 'Bearer',
                        expires_in: ACCESS_TOKEN_EXPIRES_IN_SECONDS
                    });
                }
            }
        );
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/* GET home page. */
router.get('*', function (req, res, next) {
    res.render('index.html');
});

module.exports = router;
