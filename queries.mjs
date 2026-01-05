"use strict"
export class queries
{
	#sqlQueries;
	constructor()
	{
		this.#sqlQueries = new Map();
		this.#sqlQueries.set("create db", "CREATE DATABASE ");
		this.#sqlQueries.set("create tb", "CREATE TABLE ");
		this.#sqlQueries.set("insert", "INSERT INTO ");
		this.#sqlQueries.set("select_all", "SELECT * FROM ");
	}
	constrcutAQuery(args)
	{
		let i, query;
		query = '';
		for (i = 0; i < args.length; i++)
			query += args[i];
		return query;
	}
	get_value(key)
	{
		let i;
		for (i = 0; i < this.#sqlQueries.size; i++)
		{
			if (this.#sqlQueries.has(key))
				return this.#sqlQueries.get(key);
		}
		return null;
	}
}
