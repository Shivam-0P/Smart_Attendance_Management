const DEFAULT_AI_URL = "https://api.openai.com/v1/chat/completions";

const callAI = async (systemMessage, userMessage) => {
	const apiKey = process.env.AI_API_KEY;
	if (!apiKey) {
		const error = new Error("AI provider is not configured");
		error.code = "AI_NOT_CONFIGURED";
		throw error;
	}

	const response = await fetch(process.env.AI_API_URL || DEFAULT_AI_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: process.env.AI_MODEL || "gpt-4o-mini",
			temperature: 0.1,
			max_tokens: 350,
			messages: [
				{
					role: "system",
					content: systemMessage,
				},
				{
					role: "user",
					content: userMessage,
				},
			],
		}),
	});

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(payload.error?.message || "AI provider request failed");
		error.code = "AI_PROVIDER_ERROR";
		throw error;
	}

	const answer = payload.choices?.[0]?.message?.content?.trim();
	if (!answer) {
		const error = new Error("AI provider returned an empty response");
		error.code = "AI_EMPTY_RESPONSE";
		throw error;
	}

	return answer;
};

const askAttendanceQuestion = (question, data) => callAI(
	"You are a concise attendance reporting assistant. Use only the supplied JSON data. Never invent students, numbers, percentages, dates, or facts. Do not claim to have queried a database. If the supplied data is insufficient, say so clearly. You cannot modify data. Return a concise plain-text answer.",
	`Question: ${question}\n\nAuthoritative backend data:\n${JSON.stringify(data)}`
);

const askAttendanceInsights = (statistics) => callAI(
	"You are a concise administrative attendance insight assistant. Explain only the supplied backend-calculated statistics. Never calculate, invent, estimate, or modify database facts. Mention when the statistics are insufficient. Return one concise administrative insight in plain text.",
	`Generate one concise administrative insight from these authoritative backend-calculated statistics. Do not add facts:\n${JSON.stringify(statistics)}`
);

const generateAttendanceReport = (statistics) => callAI(
	"You are a concise administrative attendance report writer. Use only the supplied backend-calculated statistics. Do not calculate, invent, estimate, or modify any database facts. Return a structured plain-text report with exactly these headings: Overall attendance summary, Department-wise observations, Subject-wise observations, Students below 75%, Areas requiring administrative attention. State clearly when the supplied statistics are insufficient.",
	`Generate the requested structured report from these authoritative statistics. Keep it concise and do not add facts:\n${JSON.stringify(statistics)}`
);

module.exports = { askAttendanceQuestion, askAttendanceInsights, generateAttendanceReport };
