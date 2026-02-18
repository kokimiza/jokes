interface ContactFormData {
	name: string;
	email: string;
	subject: string;
	message: string;
}

export const onRequestPost: PagesFunction<unknown> = async (context) => {
	try {
		const formData = (await context.request.json()) as ContactFormData;

		// Validate input
		if (
			!formData.name ||
			!formData.email ||
			!formData.subject ||
			!formData.message
		) {
			return new Response(
				JSON.stringify({ error: "All fields are required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			return new Response(JSON.stringify({ error: "Invalid email address" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Send email using MailChannels
		const emailResponse = await fetch(
			"https://api.mailchannels.net/tx/v1/send",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					personalizations: [
						{
							to: [{ email: "support@jocarium.productions" }],
							reply_to: { email: formData.email, name: formData.name },
						},
					],
					from: {
						email: "noreply@jocarium.productions",
						name: "Contact Form",
					},
					subject: `[Contact Form] ${formData.subject}`,
					content: [
						{
							type: "text/plain",
							value: `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
						},
						{
							type: "text/html",
							value: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${formData.name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Subject:</strong> ${formData.subject}</p>
              <h3>Message:</h3>
              <p>${formData.message.replace(/\n/g, "<br>")}</p>
            `,
						},
					],
				}),
			},
		);

		if (!emailResponse.ok) {
			throw new Error("Failed to send email");
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error sending email:", error);
		return new Response(JSON.stringify({ error: "Failed to send message" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
