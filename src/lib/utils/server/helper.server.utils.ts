// lib/utils/queryBuilder.ts
import { FilterQuery } from "mongoose";

export const helperServerUtils = {
    buildQuery<T>(queryParams: Record<string, any>, allowedFields: (keyof T)[]): FilterQuery<T> {
        const filter: FilterQuery<T> = {};

        for (const key of allowedFields) {
            if (queryParams[key as string] !== undefined) {
                let value: any = queryParams[key as string];

                // Convert booleans and numbers
                if (value === "true") value = true;
                else if (value === "false") value = false;
                else if (!isNaN(Number(value))) value = Number(value);

                filter[key] = value;
            }
        }

        return filter;
    }
}