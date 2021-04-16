import styles from "../styles/NutritionDisplay.module.css"

export type NutritionDisplayProps = {
	recipeName: string
	nutrients: Array<Nutrient>
	dietLabels?: Array<string>
	healthLabels?: Array<string>
}

export type Nutrient = {
	label: string
	quantity: number
	unit: string
}
export function NutritionDisplay(props: NutritionDisplayProps) {
	const { recipeName, dietLabels, healthLabels, nutrients } = props

	const nutrientsByName: Map<string, string> = new Map()
	nutrients.forEach(nutrient => {
		const quantityWithMeasurement = `${nutrient.quantity.toString()} ${
			nutrient.unit
		}`
		nutrientsByName.set(nutrient.label, quantityWithMeasurement)
	})

	return (
		<div>
			<h2>{recipeName}</h2>
			<section className={styles.section}>
				<header className={styles.header}>
					<h3 className={styles.title}>Nutrition Facts</h3>
				</header>
				<table className={styles.table}>
					<tbody>
						<tr className={styles.calories}>
							<th>
								<b>Calories</b>
							</th>
							<th>
								<b className={styles.caloric_value}>
									{nutrientsByName.get("Energy")}
								</b>
							</th>
						</tr>
						<tr>
							<th>
								<b>Total Fat</b>
							</th>
							<th>
								<b>{nutrientsByName.get("Fat")}</b>
							</th>
						</tr>
						<tr>
							<th className={styles.sub}>Saturated Fat</th>
							<th className={styles.sub}>{nutrientsByName.get("Saturated")}</th>
						</tr>
						<tr>
							<th className={styles.sub}>Trans Fat</th>
							<th className={styles.sub}>{nutrientsByName.get("Trans")}</th>
							<td></td>
						</tr>
						<tr>
							<th>
								<b>Cholesterol</b>
							</th>
							<th>
								<b>{nutrientsByName.get("Cholesterol")}</b>
							</th>
						</tr>
						<tr>
							<th>
								<b>Sodium</b>
							</th>
							<th>
								<b>{nutrientsByName.get("Sodium")}</b>
							</th>
						</tr>
						<tr>
							<th>
								<b>Total Carbohydrate</b>
							</th>
							<th>
								<b>{nutrientsByName.get("Carbs")}</b>
							</th>
						</tr>
						<tr>
							<th className={styles.sub}>Dietary Fiber</th>
							<th className={styles.sub}>{nutrientsByName.get("Fiber")}</th>
						</tr>
						<tr>
							<th className={styles.sub}>Sugars</th>
							<th className={styles.sub}>{nutrientsByName.get("Sugars")}</th>
						</tr>
						<tr>
							<th>
								<b>Protein</b>
							</th>
							<th>
								<b>{nutrientsByName.get("Protein")}</b>
							</th>
						</tr>
						<tr>
							<th>
								<b>Potassium</b>
							</th>
							<th>
								<b>{nutrientsByName.get("Potassium")}</b>
							</th>
							<td></td>
						</tr>
					</tbody>
				</table>

				<table className={styles.table_grid}>
					<tbody>
						<tr>
							<td>Vitamin A {nutrientsByName.get("Vitamin A")}</td>
							<td>Vitamin C {nutrientsByName.get("Vitamin C")}</td>
						</tr>
						<tr>
							<td>Calcium {nutrientsByName.get("Calcium")}</td>
							<td>Iron {nutrientsByName.get("Iron")}</td>
						</tr>
					</tbody>
				</table>
			</section>
		</div>
	)
}
