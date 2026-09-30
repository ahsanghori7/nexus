const pReset = (function () {
    const form = document.querySelectorAll('#new-pass-form', '#sign-up');
    const passInput = document.getElementById("pass");
    const passRepeatInput = document.getElementById("pass-repeat");
    const passShow = document.getElementById("show-pass");
    const passRepeatShow = document.getElementById("show-pass-repeat");

    const expressions = {
        letter: /[a-z]/,
        capital: /[A-Z]/,
        number: /[0-9]/,
        special: /[!%@#$&*_]/,
        length: /[a-zA-Z0-9!@#$&*_]{12,}/
    }

    const testPass = (v) => {
        let fail = [];
        for (let k in expressions) {
            let re = expressions[k];

            if (re.test(v) === false) {
                fail.push(k);
            }
        }
        return fail;
    }

    form.onsubmit = (e) => {
        if (passInput.value != passRepeatInput.value) {
            $.alert({
                title: 'Ops!!!',
                content: 'The password do not match. Please try again.',
                type: 'red',
                typeAnimated: true
            });
            e.preventDefault();
            return false
        }
        let failures = testPass(passInput.value);
        if (failures.length > 0) {
            e.preventDefault();
            return false
        }
    }

    // Show password
    passShow.onclick = function () {
        if (passInput.type === "password") {
            passInput.type = "text";
            passShow.innerHTML = '<i class="fa fa-eye-slash"></i>';
        } else {
            passInput.type = "password";
            passShow.innerHTML = '<i class="fa fa-eye"></i>';
        }
    };

    passRepeatShow.onclick = function () {
        if (passRepeatInput.type === "password") {
            passRepeatInput.type = "text";
            passRepeatShow.innerHTML = '<i class="fa fa-eye-slash"></i>';
        } else {
            passRepeatInput.type = "password";
            passRepeatShow.innerHTML = '<i class="fa fa-eye"></i>';
        }
    };

    function checkEquality() {
        if (passRepeatInput.value !== passInput.value) {
            document.querySelector(".pass-match").classList.add("d-none");
            document.querySelector(".pass-match-not").classList.remove("d-none");
        } else {
            document.querySelector(".pass-match").classList.remove("d-none");
            document.querySelector(".pass-match-not").classList.add("d-none");
        }
    }

    passInput.onfocus = function () {
        document.getElementById("pass-preview").classList.remove("d-none")
    }

    // When the user clicks outside of the password field, hide the message box
    passInput.onblur = function () {
        document.getElementById("pass-preview").classList.add("d-none");
    }

    // When the user starts to type something inside the password field
    passInput.onkeyup = (ev) => {
        let failures = testPass(passInput.value);

        for (let i in expressions) {
            let el = document.getElementById(i);

            if (failures.indexOf(i) === -1) {
                $(el).removeClass('invalid').addClass('valid');
            } else {
                $(el).removeClass('valid').addClass('invalid');
            }
        }
    }

    passRepeatInput.onfocus = function () {
        document.getElementById("pass-repeat-preview").classList.remove("d-none");
        checkEquality();
    }

    passRepeatInput.oninput = function () {
        checkEquality();
    }

    // When the user clicks outside of the password field, hide the message box
    passRepeatInput.onblur = function () {
        document.getElementById("pass-repeat-preview").classList.add("d-none");
        checkEquality();
    }

}());
