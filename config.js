exports.createPasswordResetEmail = (opts) => {
    const token = opts.token;

    return {
        from: 'EDMSpotOfficial@gmail.com',
        subject: 'EDM Spot Password Reset Request',
        text: stripIndent(`
            Hello,
            Please visit this link to reset your password:
            https://edmspot.ml/reset/${token}
            EDM Spot
        `),
        html: stripIndent(`
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="initial-scale=1.0">
            </head>
            <body bgcolor="#151515" style="margin: 0; background: #151515; color: #ffffff; font-family: 'Open Sans', sans-serif; font-size: 16px;">
            <div style="margin: auto; max-width: 600px;">
                <p> Hello, </p>
                <p> Please press this button to reset your password: </p>
                <p>
                <a href="https://edmspot.ml/reset/${token}" style="${buttonStyle}">Reset Password</a>
                </p>
                <p> Or, if that does not work, please copy and paste this link: </p>
                <p style="font-family: monospace">http://localhost/reset/${token}</p>
                <p> EDM Spot </p>
            </div>
            </body>
            </html>
        `)
    };
};
