<script type="text/javascript">

	function updateCompanyLogo(file) {
		let formData = new FormData();
		formData.append("logo", file);
		$.ajax({
			url: '/relay?action=account&method=updateLogo',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: function (response) {

			},
			error: function (error) {
				if (error && error.responseJSON) {
					const { error: errorMessage, status } = error.responseJSON;
					$.alert({
						title: `Error ${status}`,
						content: errorMessage,
						type: 'red'
					});
				} else {
					$.alert({
						title: 'Oops!!!',
						content: 'Error when changing the logo',
						type: 'red'
					});

				}

			}
		});
	}

	function submitLogo(file, area = 'user') {

		let data;
		let action;

        data = {'account': {'logo': file.name}};
		$.ajax({
			url: '/relay?action=account&method=update',
			data: JSON.stringify(data),
			type: 'PATCH',
			contentType: 'application/json',
			async: false
		}).done((msg) => {
			$.alert({
				title: 'Success',
				content: 'Logo successfully changed',
				type: 'green',
				typeAnimated: true
			});
          updateCompanyLogo(file);
		}).catch((error) => {
			$.alert({
				title: 'Oops!!!',
				content: 'Error when updating account info',
				type: 'red'
			});
		});

	}

	function previewFile(input, area = 'user') {
		let file = $(input).get(0).files[0];
        let error = "";
		if (!file) {
			return;
		}

		const ext = file.name.split('.').pop();

		if (["jpg", "png"].indexOf(ext.toLowerCase()) === -1) {
			error = "Invalid file extension";
		}

		if (((file.size / 1024) / 1024).toFixed(4) > 3) {
			error = "You image size exceeds our permission. Maximum allowed is 3Mb";
		}

		if (error) {
			$.alert({
				title: 'Opps!!!',
				content: error,
				type: 'red',
				typeAnimated: true
			});
			return;
		}

		// https://stackoverflow.com/questions/8903854/check-image-width-and-height-before-upload-with-javascript
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function (e) {
			const image = new Image();
			image.src = e.target.result;
			image.onload = function () {
				const height = this.height;
				const width = this.width;
				if (height > 150 || width > 150) {
					error = "Height and Width must not exceed 150px.";
					$.alert({
						title: 'Opps!!!',
						content: error,
						type: 'red',
						typeAnimated: true
					});
					return false;
				}
				$(input).parents("figure").find("img").attr("src", reader.result);

				submitLogo(file, area);
				return false;
			};
		};
	}
</script>
