export type MetroStation = {
	station_name: string;
	line_name: string;
};

export type Employer = {
	name: string;
	logo_urls?: {
		[size: string]: string;
	};
	accredited_it_employer?: boolean;
	employer_rating?: {
		total_rating: string;
		reviews_count: number;
	};
};

export type Address = {
	raw?: string;
	metro?: MetroStation;
};

export type Vacancy = {
	id: string;
	name: string;
	alternate_url: string;
	experience?: {
		name: string;
	};
	schedule?: {
		name: string;
	};
	snippet?: {
		requirement?: string;
		responsibility?: string;
	};
	address?: Address;
	employer?: Employer;
};