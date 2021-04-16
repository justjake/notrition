import React from "react"
import { NutritionDisplay } from "../components/NutritionDisplay"

export default function Nutrition() {
	return (
		<NutritionDisplay
			recipe={"Sichuan Eggplant"}
			dietLabels={["HIGH_FIBER", "LOW_SODIUM"]}
			healthLabels={["VEGAN", "VEGETARIAN"]}
			nutrients={[{ label: "Energy", quantity: 564, unit: "kcal" }]}
			nutrientsByCalories={[{ label: "Energy", quantity: 565, unit: "kcal" }]}
		/>
	)
}
