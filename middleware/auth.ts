import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
	const session = req.session as { adminLoggedIn?: boolean } | undefined;
	if (req.path === "/admin/login" || req.path === "/admin/logout") {
		return next();
	}
	if (req.path.startsWith("/admin") && !session?.adminLoggedIn) {
		return res.redirect("/admin/login");
	}
	next();
}
