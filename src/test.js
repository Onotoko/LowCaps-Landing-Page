import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { SupraClient } from "supra-l1-sdk";
import {
    FaSpinner,
    FaInfoCircle,
    FaChartLine,
    FaCoins,
    FaDatabase,
    FaSync,
    FaTimes,
    FaLock,
    FaGamepad,
    FaFire,
} from "react-icons/fa";

// Configuration
const SUPRA_CLIENT_URL = "https://rpc-mainnet-citadel.supra.com/";
const MODULE_ADDRESS_VAULT = "0xb4ba040eb59c3b3c3776b7a603d896781e48bbf5fcea559c495814b5cde29b2b";
const MODULE_ADDRESS_ROUTER = "0xdc694898dff98a1b0447e0992d0413e123ea80da1021d464a4fbaf0265870d8";
const LUCKY_TOKEN = {
    name: "LUCKY",
    typeTag: "0x4205c82380bff5708cd7c59e0043a45890a457a6cdb60c9191d818958fd7ac26::LUCKY::LUCKY",
    decimals: 1e6,
    totalSupply: 1e9,
};
const SUPRA_COIN_TYPE = "0x1::supra_coin::SupraCoin";
const DEXUSDC_COIN_TYPE = "0x8f7d16ade319b0fce368ca6cdb98589c4527ce7f5b51e544a9e68e719934458b::hyper_coin::DexlynUSDC";
const CURVE_TYPE = `${MODULE_ADDRESS_ROUTER}::curves::Uncorrelated`;
const SUPRA_COIN_DECIMALS = 1e8;
const DEXUSDC_DECIMALS = 1e6;
const BURN_ADDRESS = "0xffffffffffffffffffffffffffffffff";

// Format number to exactly 2 decimal places without rounding
const formatNumber = (num, decimals = 2) => {
    if (isNaN(num)) return "0.00";
    const str = num.toString();
    const parts = str.split(".");
    if (parts.length === 1) return `${parts[0]}.${Array(decimals).fill("0").join("")}`;
    const integerPart = parts[0];
    const decimalPart = parts[1] || "";
    if (decimalPart.length <= decimals) {
        return `${integerPart}.${decimalPart.padEnd(decimals, "0")}`;
    }
    return `${integerPart}.${decimalPart.substring(0, decimals)}`;
};

// StatCard Component
const StatCard = ({ icon: Icon, title, value, loading, description, color }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const getValueFontSize = (value) => {
        if (loading) return "text-2xl";
        const length = value.length;
        if (length > 20) return "text-xl";
        if (length > 15) return "text-2xl";
        if (length > 10) return "text-2.5xl";
        return "text-3xl";
    };

    return (
        <motion.div
            ref={ref}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
            }}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            whileHover={{ scale: 1.03, boxShadow: "0 12px 24px rgba(59, 130, 246, 0.25)" }}
            className={`bg-gray-900/90 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/30 hover:border-${color}/60 transition-all duration-300 shadow-lg hover:shadow-${color}/40 flex-1 min-w-[280px] max-w-sm flex flex-col justify-between`}
        >
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 bg-${color}/30 rounded-full flex items-center justify-center shadow-md`}>
                    <Icon className={`text-${color} text-2xl`} />
                </div>
                <p className="text-gray-100 text-lg font-semibold tracking-tight">{title}</p>
            </div>
            <p className={`${getValueFontSize(value)} font-extrabold text-white break-words overflow-hidden text-ellipsis`}>
                {loading ? <FaSpinner className="animate-spin text-blue-400" /> : value}
            </p>
            <p className="text-sm text-gray-300 mt-2">{description}</p>
        </motion.div>
    );
};

StatCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    loading: PropTypes.bool.isRequired,
    description: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
};

const Stats = () => {
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });
    const [basePrice, setBasePrice] = useState(0);
    const [marketCap, setMarketCap] = useState(0);
    const [luckyPerSupra, setLuckyPerSupra] = useState(0);
    const [supraPriceInDexUSDC, setSupraPriceInDexUSDC] = useState(0);
    const [burnedTokens, setBurnedTokens] = useState(0);
    const [vaultBalance, setVaultBalance] = useState("0.00");
    const [luckySupraLiquidity, setLuckySupraLiquidity] = useState({ lucky: 0, supra: 0 });
    const [luckyDexUSDCLiquidity, setLuckyDexUSDCLiquidity] = useState({ lucky: 0, dexUSDC: 0 });
    const [isRefreshing, setIsRefreshing] = useState({
        basePrice: false,
        supraPrice: false,
        burned: false,
        vault: false,
        liquidity: false,
    });
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [notification, setNotification] = useState({ message: "", isSuccess: false, visible: false });

    // Initialize SupraClient
    const initializeSupraClient = useCallback(async () => {
        try {
            console.log("Initializing SupraClient...");
            const client = await SupraClient.init(SUPRA_CLIENT_URL);
            console.log("SupraClient initialized successfully");
            return client;
        } catch (error) {
            console.error("initializeSupraClient: Error initializing SupraClient:", error);
            return null;
        }
    }, []);

    // Generic view function caller using SupraClient
    const callViewFunction = useCallback(
        async (functionName, typeArguments, args = []) => {
            const client = await initializeSupraClient();
            if (!client) {
                throw new Error("Supra Client not initialized");
            }
            try {
                console.log(`Calling ${functionName} with type_arguments: ${typeArguments}, arguments: ${args}`);
                const response = await client.invokeViewMethod(functionName, typeArguments, args);
                console.log(`${functionName} response:`, response);
                if (!response) {
                    throw new Error(`No result for ${functionName}`);
                }
                return response;
            } catch (error) {
                console.error(`Error calling ${functionName}:`, error.message);
                throw error;
            }
        },
        [initializeSupraClient]
    );

    // Fetch LUCKY token house fund balance
    const fetchVaultBalance = useCallback(async () => {
        setIsRefreshing((prev) => ({ ...prev, vault: true }));
        try {
            console.log(`Calling get_house_fund_balance_view for LUCKY, typeTag: ${LUCKY_TOKEN.typeTag}`);
            const response = await callViewFunction(
                `${MODULE_ADDRESS_VAULT}::slots_v3::get_house_fund_balance_view`,
                [LUCKY_TOKEN.typeTag],
                [LUCKY_TOKEN.typeTag]
            );
            console.log("House Pot response for LUCKY:", response);
            const rawBalance = Number(response?.[0] ?? 0);
            const balance = rawBalance / LUCKY_TOKEN.decimals;
            console.log(`Raw balance: ${rawBalance}, Decimals: ${LUCKY_TOKEN.decimals}, Formatted balance: ${balance}`);
            setVaultBalance(formatNumber(balance, 2));
        } catch (error) {
            console.error("Error fetching LUCKY vault balance:", error);
            setVaultBalance("0.00");
            setNotification({ message: "Error fetching vault balance!", isSuccess: false, visible: true });
            setTimeout(() => setNotification({ message: "", isSuccess: false, visible: false }), 3000);
        } finally {
            setIsRefreshing((prev) => ({ ...prev, vault: false }));
        }
    }, [callViewFunction]);

    const getBurnedTokens = useCallback(async () => {
        setIsRefreshing((prev) => ({ ...prev, burned: true }));
        try {
            const result = await callViewFunction("0x1::coin::balance", [LUCKY_TOKEN.typeTag], [BURN_ADDRESS]);
            const burned = Number(BigInt(result[0])) / LUCKY_TOKEN.decimals;
            setBurnedTokens(burned);
            return burned;
        } catch (error) {
            console.error("Error fetching burned tokens:", error.message);
            setBurnedTokens(0);
            setNotification({ message: "Error fetching burned tokens!", isSuccess: false, visible: true });
            setTimeout(() => setNotification({ message: "", isSuccess: false, visible: false }), 3000);
            return 0;
        } finally {
            setIsRefreshing((prev) => ({ ...prev, burned: false }));
        }
    }, [callViewFunction]);

    const getReservesSize = useCallback(
        async (tokenX, tokenY) => {
            const isTokenX = tokenX < tokenY;
            const typeArguments = isTokenX ? [tokenX, tokenY, CURVE_TYPE] : [tokenY, tokenX, CURVE_TYPE];
            const result = await callViewFunction(`${MODULE_ADDRESS_ROUTER}::router::get_reserves_size`, typeArguments);
            if (!Array.isArray(result)) {
                throw new Error(`Unexpected response format for get_reserves_size: ${JSON.stringify(result)}`);
            }
            const [reserve_x, reserve_y] = result.map((val) => BigInt(val));
            return { reserve_x, reserve_y, isTokenX };
        },
        [callViewFunction]
    );

    const getFeesConfig = useCallback(
        async (tokenX, tokenY) => {
            const isTokenX = tokenX < tokenY;
            const typeArguments = isTokenX ? [tokenX, tokenY, CURVE_TYPE] : [tokenY, tokenX, CURVE_TYPE];
            const result = await callViewFunction(`${MODULE_ADDRESS_ROUTER}::router::get_fees_config`, typeArguments);
            if (!Array.isArray(result)) {
                throw new Error(`Unexpected response format for get_fees_config: ${JSON.stringify(result)}`);
            }
            const [fee_pct, fee_scale] = result.map((val) => Number(val));
            return { fee_pct, fee_scale };
        },
        [callViewFunction]
    );

    const getAmountOut = (coin_in, reserve_in, reserve_out, fee_pct, fee_scale) => {
        try {
            const fee_multiplier = BigInt(fee_scale - fee_pct);
            const coin_in_after_fees = BigInt(coin_in) * fee_multiplier / BigInt(fee_scale);
            const reserve_in_u128 = BigInt(reserve_in);
            const reserve_out_u128 = BigInt(reserve_out);
            const amount_out = (coin_in_after_fees * reserve_out_u128) / (reserve_in_u128 + coin_in_after_fees);
            return amount_out;
        } catch (error) {
            console.error("Error in getAmountOut:", error.message);
            return BigInt(0);
        }
    };

    const updateSupraPrice = useCallback(async () => {
        setIsRefreshing((prev) => ({ ...prev, supraPrice: true }));
        try {
            const { reserve_x, reserve_y } = await getReservesSize(SUPRA_COIN_TYPE, DEXUSDC_COIN_TYPE);
            const { fee_pct, fee_scale } = await getFeesConfig(SUPRA_COIN_TYPE, DEXUSDC_COIN_TYPE);
            const coin_in = BigInt(1 * SUPRA_COIN_DECIMALS);
            const amount_out = getAmountOut(coin_in, reserve_x, reserve_y, fee_pct, fee_scale);
            const price = Number(amount_out) / DEXUSDC_DECIMALS;
            setSupraPriceInDexUSDC(price);
            return price;
        } catch (error) {
            console.error("Error fetching SUPRA price:", error.message);
            setSupraPriceInDexUSDC(0);
            return 0;
        } finally {
            setIsRefreshing((prev) => ({ ...prev, supraPrice: false }));
        }
    }, [getReservesSize, getFeesConfig]);

    const getTokenPriceAndMarketCap = useCallback(
        async (tokenTypeTag) => {
            try {
                const decimals = LUCKY_TOKEN.decimals;
                const supply = LUCKY_TOKEN.totalSupply;
                let priceInDexUSDC = 0;
                let priceInSupra = 0;

                if (tokenTypeTag === DEXUSDC_COIN_TYPE) {
                    priceInDexUSDC = 1;
                    priceInSupra = 0;
                } else if (tokenTypeTag === SUPRA_COIN_TYPE) {
                    priceInDexUSDC = supraPriceInDexUSDC;
                    priceInSupra = 1;
                } else {
                    const { reserve_x, reserve_y, isTokenX } = await getReservesSize(tokenTypeTag, SUPRA_COIN_TYPE);
                    const reserveSupra = isTokenX ? reserve_y : reserve_x;
                    const reserveLucky = isTokenX ? reserve_x : reserve_y;
                    if (reserveSupra <= 0 || reserveLucky <= 0) {
                        throw new Error("Invalid reserves: reserveSupra or reserveLucky is zero or negative");
                    }
                    priceInSupra = Number(reserveSupra) / SUPRA_COIN_DECIMALS / (Number(reserveLucky) / decimals);
                    priceInDexUSDC = priceInSupra * supraPriceInDexUSDC;
                }
                const marketCap = supply > 0 && priceInDexUSDC > 0 ? priceInDexUSDC * supply : 0;
                const luckyPerSupra = priceInSupra > 0 ? 1 / priceInSupra : 0;
                return { price: priceInDexUSDC, marketCap, luckyPerSupra };
            } catch (error) {
                console.error(`Error calculating price for ${tokenTypeTag}:`, error.message);
                return { price: 0, marketCap: 0, luckyPerSupra: 0 };
            }
        },
        [supraPriceInDexUSDC, getReservesSize]
    );

    const fetchLuckyPriceAndMarketCap = useCallback(
        async () => {
            setIsRefreshing((prev) => ({ ...prev, basePrice: true }));
            try {
                const supraPrice = await updateSupraPrice();
                if (supraPrice === 0) {
                    throw new Error("Failed to fetch SUPRA price");
                }
                const { price, marketCap, luckyPerSupra } = await getTokenPriceAndMarketCap(LUCKY_TOKEN.typeTag);
                setLuckyPerSupra(luckyPerSupra);
                setBasePrice(price);
                setMarketCap(marketCap);
            } catch (error) {
                console.error("Error fetching LUCKY price and market cap:", error.message);
                setLuckyPerSupra(0);
                setBasePrice(0);
                setMarketCap(0);
                setNotification({ message: "Error fetching LUCKY data!", isSuccess: false, visible: true });
                setTimeout(() => setNotification({ message: "", isSuccess: false, visible: false }), 3000);
            } finally {
                setIsRefreshing((prev) => ({ ...prev, basePrice: false }));
            }
        },
        [getTokenPriceAndMarketCap, updateSupraPrice]
    );

    // Fetch liquidity for LUCKY/SUPRA and LUCKY/dexUSDC pools
    const fetchLiquidityMetrics = useCallback(async () => {
        setIsRefreshing((prev) => ({ ...prev, liquidity: true }));
        try {
            // LUCKY/SUPRA pool (LUCKY is tokenX, SUPRA is tokenY)
            const supraPool = await getReservesSize(LUCKY_TOKEN.typeTag, SUPRA_COIN_TYPE);
            setLuckySupraLiquidity({
                lucky: Number(supraPool.reserve_x) / LUCKY_TOKEN.decimals,
                supra: Number(supraPool.reserve_y) / SUPRA_COIN_DECIMALS,
            });

            // LUCKY/dexUSDC pool (LUCKY is tokenX, dexUSDC is tokenY)
            const dexUSDCPool = await getReservesSize(LUCKY_TOKEN.typeTag, DEXUSDC_COIN_TYPE);
            setLuckyDexUSDCLiquidity({
                lucky: Number(dexUSDCPool.reserve_x) / LUCKY_TOKEN.decimals,
                dexUSDC: Number(dexUSDCPool.reserve_y) / DEXUSDC_DECIMALS,
            });
        } catch (error) {
            console.error("Error fetching liquidity metrics:", error.message);
            setLuckySupraLiquidity({ lucky: 0, supra: 0 });
            setLuckyDexUSDCLiquidity({ lucky: 0, dexUSDC: 0 });
            setNotification({ message: "Error fetching liquidity data!", isSuccess: false, visible: true });
            setTimeout(() => setNotification({ message: "", isSuccess: false, visible: false }), 3000);
        } finally {
            setIsRefreshing((prev) => ({ ...prev, liquidity: false }));
        }
    }, [getReservesSize]);

    const formatPrice = (price) => {
        if (price === 0) return "$0.000000";
        if (price < 0.000001) return `$${price.toFixed(12)}`;
        if (price < 0.01) return `$${price.toFixed(8)}`;
        return `$${price.toFixed(6)}`;
    };

    const formatMarketCap = (marketCap) => {
        if (marketCap === 0) return "$0.00";
        if (marketCap < 1000) return `$${marketCap.toFixed(2)}`;
        if (marketCap < 1000000) return `$${(marketCap / 1000).toFixed(2)}K`;
        return `$${(marketCap / 1000000).toFixed(2)}M`;
    };

    const formatLuckyPerSupra = (luckyPerSupra) => {
        if (luckyPerSupra === 0) return "0.00 LUCKY";
        return `${formatNumber(luckyPerSupra, 4)} LUCKY`;
    };

    const formatVaultBalance = (balance) => {
        return `${balance} LUCKY`;
    };

    const formatLiquidity = (pool, type) => {
        if (type === "supra") {
            if (pool.lucky === 0 && pool.supra === 0) return "0.00 LUCKY / 0.00 SUPRA";
            return `${formatNumber(pool.lucky, 2)} LUCKY / ${formatNumber(pool.supra, 2)} SUPRA`;
        } else if (type === "dexUSDC") {
            if (pool.lucky === 0 && pool.dexUSDC === 0) return "0.00 LUCKY / 0.00 dexUSDC";
            return `${formatNumber(pool.lucky, 2)} LUCKY / ${formatNumber(pool.dexUSDC, 2)} dexUSDC`;
        }
        return "0.00";
    };

    const calculateSupply = {
        total: () => formatNumber(LUCKY_TOKEN.totalSupply),
        burned: () => formatNumber(burnedTokens, 0),
        circulating: () => formatNumber(LUCKY_TOKEN.totalSupply - burnedTokens),
    };

    const refreshData = useCallback(
        async () => {
            try {
                await Promise.all([
                    fetchLuckyPriceAndMarketCap(),
                    getBurnedTokens(),
                    fetchVaultBalance(),
                    fetchLiquidityMetrics(),
                ]);
                setNotification({ message: "Data refreshed!", isSuccess: true, visible: true });
                setTimeout(() => setNotification({ message: "", isSuccess: false, visible: false }), 3000);
            } catch (error) {
                console.error("Error refreshing data:", error.message);
                setNotification({ message: "Error refreshing data!", isSuccess: false, visible: true });
                setTimeout(() => setNotification({ message: "", isSuccess: false, visible: false }), 3000);
            }
        },
        [fetchLuckyPriceAndMarketCap, getBurnedTokens, fetchVaultBalance, fetchLiquidityMetrics]
    );

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 60000);
        return () => clearInterval(interval);
    }, [refreshData]);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.8, staggerChildren: 0.1 } },
    };

    const buttonVariants = {
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
        exit: { opacity: 0, scale: 0.9 },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 px-4 sm:px-6 lg:px-8 flex flex-col items-center font-sans antialiased">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-[-20%] left-[-20%] w-[700px] h-[700px] bg-blue-600/15 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse animate-delay-2000" />
                <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] animate-pulse animate-delay-4000" />
                {Array.from({ length: 30 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-white/20 rounded-full"
                        initial={{ x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%`, scale: Math.random() * 0.7 + 0.3 }}
                        animate={{ y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`], opacity: [0.2, 0.6, 0.2], scale: [1, 1.7, 1] }}
                        transition={{ duration: Math.random() * 12 + 8, repeat: Infinity, ease: "linear" }}
                    />
                ))}
            </div>

            <motion.div
                ref={containerRef}
                variants={containerVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="w-full max-w-7xl py-16"
            >
                {/* Token Analytics Section */}
                <motion.div
                    className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-blue-500/20 mb-8"
                    variants={fadeIn}
                >
                    <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <FaCoins className="text-white text-sm" />
                                </div>
                                <p className="text-gray-200 text-lg font-semibold tracking-wide">Token Analytics</p>
                            </div>
                            <p className="text-1xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-4 leading-loose tracking-wide">
                                LuckyCoin (LUCKY)
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <motion.button
                                onClick={() => setIsInfoModalOpen(true)}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                className="px-5 py-2.5 bg-gray-800/70 text-blue-400 font-semibold rounded-lg shadow-lg hover:bg-gray-800/90 flex items-center gap-2 text-sm border border-blue-500/30"
                                aria-label="Open Info Modal"
                            >
                                <FaInfoCircle /> Info
                            </motion.button>
                            <motion.button
                                onClick={refreshData}
                                disabled={Object.values(isRefreshing).some((v) => v)}
                                variants={buttonVariants}
                                whileHover={Object.values(isRefreshing).some((v) => v) ? {} : "hover"}
                                whileTap={Object.values(isRefreshing).some((v) => v) ? {} : "tap"}
                                className={`px-5 py-2.5 text-sm font-semibold rounded-lg shadow-lg flex items-center gap-2 transition-all ${Object.values(isRefreshing).some((v) => v)
                                    ? "bg-gray-800/70 text-gray-500 cursor-not-allowed border border-gray-700/30"
                                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/40 border border-blue-500/50"
                                    }`}
                                aria-label="Refresh Data"
                            >
                                {Object.values(isRefreshing).some((v) => v) ? (
                                    <>
                                        <FaSpinner className="animate-spin h-5 w-5" /> Updating...
                                    </>
                                ) : (
                                    <>
                                        <FaSync className="h-5 w-5" /> Refresh
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            icon={FaDatabase}
                            title="Total Supply"
                            value={`${calculateSupply.total()} LUCKY`}
                            loading={false}
                            description="Total tokens issued"
                            color="blue-400"
                        />
                        <Link to="https://suprascan.io/address/0xffffffffffffffffffffffffffffffff/f?tab=tokens&tokenType=token&pageNo=1&rows=10" target="_blank" rel="noopener noreferrer">
                            <StatCard
                                icon={FaFire}
                                title="Burned"
                                value={`${calculateSupply.burned()} LUCKY`}
                                loading={isRefreshing.burned}
                                description="Total tokens burned to 0xfff...fff"
                                color="red-400"
                            />
                        </Link>
                        <StatCard
                            icon={FaCoins}
                            title="Circulating Supply"
                            value={`${calculateSupply.circulating()} LUCKY`}
                            loading={isRefreshing.burned}
                            description="Tokens available in circulation"
                            color="blue-400"
                        />
                        <StatCard
                            icon={FaChartLine}
                            title="Lucky Price"
                            value={formatPrice(basePrice)}
                            loading={isRefreshing.basePrice}
                            description="Price in USD (dexUSDC) on Dexlyn"
                            color="purple-400"
                        />
                        <StatCard
                            icon={FaCoins}
                            title="LUCKY per SUPRA"
                            value={formatLuckyPerSupra(luckyPerSupra)}
                            loading={isRefreshing.basePrice}
                            description="LUCKY tokens per 1 SUPRA"
                            color="purple-400"
                        />
                        <StatCard
                            icon={FaChartLine}
                            title="Market Cap"
                            value={formatMarketCap(marketCap)}
                            loading={isRefreshing.basePrice}
                            description="Market cap in USD (dexUSDC)"
                            color="blue-400"
                        />
                    </div>
                </motion.div>

                {/* Liquidity Section */}
                <motion.div
                    className="bg-gradient-to-br from-gray-900/80 to-teal-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-teal-500/20 mb-8"
                    variants={fadeIn}
                >
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-10">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center">
                            <FaCoins className="text-white text-sm" />
                        </div>
                        <p className="text-gray-200 text-lg font-semibold tracking-wide">Liquidity Metrics</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            icon={FaCoins}
                            title="LUCKY/SUPRA"
                            value={formatLiquidity(luckySupraLiquidity, "supra")}
                            loading={isRefreshing.liquidity}
                            description="Reserves in LUCKY/SUPRA pool"
                            color="teal-400"
                        />
                        <StatCard
                            icon={FaChartLine}
                            title="LUCKY/dexUSDC"
                            value={formatLiquidity(luckyDexUSDCLiquidity, "dexUSDC")}
                            loading={isRefreshing.liquidity}
                            description="Reserves in LUCKY/dexUSDC pool"
                            color="teal-400"
                        />
                        <StatCard
                            icon={FaCoins}
                            title="Liquidity Providers"
                            value="1"
                            loading={false}
                            description="Number of liquidity providers"
                            color="teal-400"
                        />
                    </div>
                </motion.div>


                {/* Staking and Vaults Section */}
                <motion.div
                    className="bg-gradient-to-br from-gray-900/80 to-red-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-red-500/20 mb-8"
                    variants={fadeIn}
                >
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-10">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
                            <FaLock className="text-white text-sm" />
                        </div>
                        <p className="text-gray-200 text-lg font-semibold tracking-wide">Staking & Vaults</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:justify-items-center">
                        <StatCard
                            icon={FaLock}
                            title="Staked"
                            value="Coming Soon"
                            loading={false}
                            description="Total tokens staked"
                            color="red-400"
                        />
                        <StatCard
                            icon={FaGamepad}
                            title="Games Vaults"
                            value={formatVaultBalance(vaultBalance)}
                            loading={isRefreshing.vault}
                            description="Tokens in games vaults"
                            color="red-400"
                        />
                    </div>
                </motion.div>

                {/* Footer Note */}
                <motion.div className="mt-12 text-center text-gray-300 text-sm" variants={fadeIn}>
                    <p>
                        Powered by{" "}
                        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            Supra Blockchain
                        </span>
                    </p>
                    <p className="text-xs mt-2 text-gray-400">Data updates every 60 seconds | Source: Dexlyn</p>
                </motion.div>

                {/* Info Modal */}
                <AnimatePresence>
                    {isInfoModalOpen && (
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm z-50 px-4"
                            onClick={() => setIsInfoModalOpen(false)}
                        >
                            <motion.div
                                className="bg-gray-900/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-blue-500/30 w-full max-w-lg"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <FaInfoCircle className="text-blue-400" /> About LuckyCoin Dashboard
                                    </h3>
                                    <button
                                        onClick={() => setIsInfoModalOpen(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        aria-label="Close Info Modal"
                                    >
                                        <FaTimes className="text-xl" />
                                    </button>
                                </div>
                                <div className="space-y-4 text-gray-300 text-base">
                                    <p>Real-time analytics for LuckyCoin (LUCKY) on Dexlyn.</p>
                                    <p>Prices in USD (dexUSDC), updated every 60 seconds for accuracy.</p>
                                    <p>Supply data reflects tokens issued and burned on the platform.</p>
                                    <p>Market cap calculated based on Dexlyn liquidity pools.</p>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <motion.button
                                        onClick={() => setIsInfoModalOpen(false)}
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-blue-500/40"
                                        aria-label="Close Info Modal"
                                    >
                                        Close
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                    {notification.visible && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className={`fixed bottom-6 right-6 p-4 rounded-lg text-sm ${notification.isSuccess
                                ? "bg-gradient-to-r from-green-600 to-green-700"
                                : "bg-gradient-to-r from-red-600 to-red-700"
                                } text-white shadow-xl z-[1000] max-w-[90%] sm:max-w-sm flex items-center gap-3`}
                        >
                            {notification.isSuccess ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                            {notification.message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

Stats.propTypes = {};

export default Stats;