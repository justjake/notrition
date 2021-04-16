import styles from "../styles/NutritionDisplay.module.css"

type Nutrient = {
	label: string
	quantity: number
	unit: string
}

type NutritionDisplayProps = {
	recipe: string
	dietLabels: Array<string>
	healthLabels: Array<string>
	nutrients: Array<Nutrient>
}

export function NutritionDisplay(props: NutritionDisplayProps) {
	const { recipe, dietLabels, healthLabels, nutrients } = props

	const nutrientsByName: Map<string, number> = new Map()
	nutrients.forEach(nutrient => {
		nutrientsByName.set(nutrient.label, nutrient.quantity)
	})

	return (
		<div>
			<h2>{recipe}</h2>
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
							<td>Vitamin A 10%</td>
							<td>Vitamin C 0%</td>
						</tr>
						<tr>
							<td>Calcium 10%</td>
							<td>Iron 6%</td>
						</tr>
					</tbody>
				</table>
			</section>
		</div>
	)
}
