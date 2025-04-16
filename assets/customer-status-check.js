// Get the visitorId.


const value = window.simplyOtp.generated_hash;
const timeStamp = window.simplyOtp.time_stamp;
const myShopifyDomain = simplyOtp.permanentDomain;

const skipCheckCustomerStatus = getCookie('_skip_check_login_status');

function getCookie (name){
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

async function sendCheckCustomerLoginState() {
    let action = "checkLoginStatus";
    let fingerprintHash = "";
    let trans = '';
    let fingerprintData = '';
    if (simplyOtp.otp_widgets.fraud_detection) {
        const fingerprintResult = await window.simplyOtp.fpPromise.then(FingerprintJS => FingerprintJS.load())
            .then(fp => fp.get())
            .then(async result => {
                delete result.components.canvas;
                delete result.components.webGlExtensions;
                result.visitedAt = Date.now();
                return { result };
            }).catch(error => {
                console.log(error)
            });

        if (!fingerprintResult) {
            console.log('Failed to obtain fingerprint data.');
        }

        const uniqueId = `${fingerprintResult.result.visitorId}${value}${myShopifyDomain}`;
        fingerprintHash = await generateHashWithUniqueId(fingerprintResult.result, uniqueId);
        trans = `${value}.${timeStamp}`;
        fingerprintData = JSON.stringify(fingerprintResult.result);
    }



    let data = {
        data: fingerprintData,
        visit: fingerprintHash,
        trans: trans
    }

    data = JSON.stringify(data);

    const appUrl = `https://omqkhavcch.execute-api.ap-south-1.amazonaws.com/simplyotplogin/v6/otp`;
    fetch(appUrl, {
        method: 'POST', // or 'PUT'
        headers: {
            'Content-Type': 'application/json',
            'shop_name': myShopifyDomain,
            'action': action
        },
        body: data,
    })
        .then(response => response.json())
        .then(response => {
            checkLoginStatus(response); // invoke call-back method
        })
        .catch((error) => {
            console.log(error);
            window.simplyOtp.initializeSimplyOtp();
        })

}

const checkLoginStatus = (response) => {
    if (response?.data?.redirectURL) {
        if (response.data.redirectURL.includes("/account/activate")) {
            performAccountActivateAction(response.data.redirectURL);
        } else {
            performLoginAction(response.data.redirectURL);
        }
    } else {
        window.simplyOtp.initializeSimplyOtp();
    }
}

const performLoginAction = (url_string) => {

    try {
        let url = new URL(url_string);
        let token = url.searchParams.get("logintoken");

        //split payload from token
        let strBase64Url = token.split('.')[1];
        let base64 = strBase64Url.replace('-', '+').replace('_', '/');
        let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payloadObject = JSON.parse(jsonPayload);
        document.body.dispatchEvent(new Event("sotp.login"));
        if (payloadObject.jti && payloadObject.iss) {
            let userName = payloadObject.jti;
            let userPassword = payloadObject.iss;
            createLoginFormAndSubmit(userName, userPassword);
        }
        else {
            window.location = url_string;
        }
    }
    catch (error) {
        console.log(error);
        window.location = url_string;
    }
}

const createLoginFormAndSubmit = (userName, userPassword) => {
    document.getElementById('otp-original-email').value = userName;
    document.getElementById('otp-original-password').value = userPassword;
    if (simplyOtp.settings.goKwik && this.checkout_url.includes("checkout")) {
        document.getElementById('otp-return_to').value = location.origin + "/account/login#ref=gokwik";
        let elements = document.getElementsByName("checkout_url");
        elements.forEach((function (x) {
            x.remove();
        }));
    }
    else if (this.checkout_url != "") {
        let checkout_url = this.checkout_url;
        let elements = document.getElementsByName('return_url');
        elements.forEach((function (x) {
            x.value = checkout_url;
        }));
        // document.getElementById('otp-return_to').remove();
    }
    else if (document.getElementById('otp-return_to')) {
        document.getElementById('otp-return_to').remove();
    }
    document.getElementById("sotp-form").submit();
}

const performAccountActivateAction = (url_string) => {
    try {
        const url = new URL(url_string);
        const pathVariables = url.pathname.split("/")
        let timeStamp = new Date().getTime().toString();
        let urlencodedBody = new URLSearchParams();
        urlencodedBody.append("form_type", "activate_customer_password");
        urlencodedBody.append("utf8", "✓");
        urlencodedBody.append("customer[password]", timeStamp);
        urlencodedBody.append("customer[password_confirmation]", timeStamp);
        urlencodedBody.append("token", pathVariables.pop());
        urlencodedBody.append("id", pathVariables.pop());

        const requestOptions = {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: urlencodedBody
        };

        fetch(`${location.origin}/account/activate`, requestOptions)
            .then(response => response.text())
            .then(response => window.location = `${location.origin}/account`)
            .catch(error => {
                console.log('error', error);
                window.location = url_string
            });
    } catch (error) {
        console.log(error);
        window.location = url_string;
    }
}

let generateHashWithUniqueId = async (data, uniqueId) => {
    const concatenatedString = JSON.stringify(data) + uniqueId;
    const cryptoObj = window.crypto || window.msCrypto;
    const hasher = cryptoObj.subtle || cryptoObj.webkitSubtle;
    const algorithm = { name: 'SHA-256' };
    const concatenatedData = new TextEncoder().encode(concatenatedString);
    const hash = await hasher.digest(algorithm, concatenatedData);
    const hashHex = Array.from(new Uint8Array(hash)).map(byte => ('0' + byte.toString(16)).slice(-2)).join('');
    return hashHex;
}

if (!window.simplyOtp.customer && simplyOtp.otp_widgets.auto_login_enable && window.location.pathname == '/account/login' && skipCheckCustomerStatus !== 'true') {
    sendCheckCustomerLoginState();
} else {
    window.simplyOtp.initializeSimplyOtp();
}