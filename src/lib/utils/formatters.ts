export class FormatUtils {
    static formatNumber(num: number, decimals: number = 2): string {
        if (isNaN(num)) return "0".padEnd(decimals + 2, ".00");

        const str = num.toString();
        const parts = str.split(".");

        if (parts.length === 1) {
            return `${parts[0]}.${"0".repeat(decimals)}`;
        }

        const integerPart = parts[0];
        const decimalPart = parts[1] || "";

        if (decimalPart.length <= decimals) {
            return `${integerPart}.${decimalPart.padEnd(decimals, "0")}`;
        }

        return `${integerPart}.${decimalPart.substring(0, decimals)}`;
    }

    static formatPrice(price: number): string {
        if (price === 0) return "$0.000000";
        if (price < 0.000001) return `$${price.toFixed(12)}`;
        if (price < 0.01) return `$${price.toFixed(8)}`;
        return `$${price.toFixed(6)}`;
    }

    static formatMarketCap(marketCap: number): string {
        if (marketCap === 0) return "$0.00";
        if (marketCap < 1000) return `$${marketCap.toFixed(2)}`;
        if (marketCap < 1000000) return `$${(marketCap / 1000).toFixed(2)}K`;
        return `$${(marketCap / 1000000).toFixed(2)}M`;
    }

    static formatSupply(supply: number): string {
        return this.formatNumber(supply, 2);
    }
}
