import Vue from "vue";
const CONSTRANTS = {
	"ITEMS_PER_PAGE" : [{text:"10",value:10}, {text:"20",value:20}, {text:"30",value:30}, {text:"50",value:50}, {text:"100",value:100}]
}
Vue.filter("formatNumber", (value) => {
	if(value === 0) return value
	let regexp = /\B(?=(\d{3})+(?!\d))/g;
	return value.toString().replace(regexp, ',');
});

Vue.mixin({
	methods: {
		toast(msg, variant) {
			if (!variant) variant = "info";
			this.$bvToast.toast(msg, { title: variant, noCloseButton: false, variant: variant, autoHideDelay: 4000});
		},
		mesbox(msg) {
			this.$bvModal.msgBoxOk(msg, { title: "", variant: "info", buttonSize: "sm", footerClass: "p-1"});
		},
		confirm(msg, callback) {
			this.$bvModal
				.msgBoxConfirm(msg, { title: "", variant: "info", buttonSize: "sm", footerClass: "p-1"})
				.then(callback)
				.catch((_) => {});
		},
		msghttp(error) {
			if (error.response && error.response.data && error.response.data.message ) {
				this.toast(error.response.data.message, "warning");
			} else {
				this.toast(error.message, "danger");
			}
		},
		var(name) {
			return CONSTRANTS[name];
		},
		getElapsedTime(timestamp) {
			let elapsedTime = new Date() - Date.parse(timestamp);

			let second = Math.floor((elapsedTime % (1000 * 60)) / 1000);
			let minute = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
			let hour = Math.floor((elapsedTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			let days = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
			let str = "";

			if (days > 0) {
				str += `${days}d`;
				if (days >= 10) return str;
			}
			if (hour > 0) {
				str += `${hour}h`;
				if (days < 10 && days > 0) return str;
			}
			if (minute > 0) {
				if (days > 0 || hour > 0) return str;
				str += `${minute}m`;
			}

			if (second > 0) {
				if (hour > 0 || minute > 9) return str;
				str += `${second}s`;
			}
			return str;
		},
		unitsToBytes(value) {
			const base = 1024;
			const suffixes = ["K", "M", "G", "T", "P", "E"];

			if (!suffixes.some(suffix => value.includes(suffix))) {
				return parseFloat(value);
			}

			const suffix = value.replace(/[0-9]|i|\./g, "");
			const index = suffixes.indexOf(suffix);

			return parseInt(
				(parseFloat(value) * Math.pow(base, index + 1)).toFixed(1)
			);
		},
		cpuUnitsToNumber(cpu) {
			const thousand = 1000;
			const million = thousand * thousand;
			const shortBillion = thousand * million;

			const cpuNum = parseInt(cpu);
			if (cpu.includes("k")) return cpuNum * thousand;
			if (cpu.includes("m")) return cpuNum / thousand;
			if (cpu.includes("u")) return cpuNum / million;
			if (cpu.includes("n")) return cpuNum / shortBillion;

			return parseFloat(cpu);
		},
		metricUnitsToNumber(value) {
			const base = 1000;
			const suffixes = ["k", "m", "g", "t", "p"];

			const suffix = value.toLowerCase().slice(-1);
			const index = suffixes.indexOf(suffix);

			return parseInt(
				(parseFloat(value) * Math.pow(base, index + 1)).toFixed(1)
			);
		},
		memoryUnitsToNumber(value) {
			const base = 1024;
			const suffixes = ["ki", "mi", "gi","ti","pi"]

			const suffix = value.toLowerCase().slice(-2);
			const index = suffixes.indexOf(suffix);

			return (parseFloat(value) * Math.pow(base, index + 1))
		},
		cpuRL(cpu) {
			if(!cpu) return 0
			return this.cpuUnitsToNumber(cpu)
		},
		memoryRL(memory) {
			if(!memory) return 0
			return this.memoryUnitsToNumber(memory)/(1024 * 1024)
		},
		getTimestampString(timestamp) {
			let dt = Date.parse(timestamp);
			let seconds = Math.floor((new Date() - dt) / 1000);

			var interval = seconds / 31536000;
			if (interval > 1) return Math.floor(interval) + " years";

			interval = seconds / 2592000;
			if (interval > 1) return Math.floor(interval) + " months";

			interval = seconds / 86400;
			if (interval > 1) return Math.floor(interval) + " days";

			interval = seconds / 3600;
			if (interval > 1) return Math.floor(interval) + " hours";
			interval = seconds / 60;
			if (interval > 1) return Math.floor(interval) + " minutes";

			return Math.floor(seconds) + " seconds";
		},
		toStatus(deletionTimestamp, status) {
			// 삭제
			if (deletionTimestamp) {
				return { "value": "Terminating", "style": "text-secondary"}
			}

			// Pending
			if (!status.containerStatuses) {
				if(status.phase === "Failed") {
					return { "value": status.phase, "style": "text-danger"}
				} else {
					return { "value": status.phase, "style": "text-warning"}
				}
			}

			// [if]: Running, [else]: (CrashRoofBack / Completed / ContainerCreating)
			if(status.containerStatuses.filter(el => el.ready).length === status.containerStatuses.length) {
				const state = Object.keys(status.containerStatuses.find(el => el.ready).state)[0]
				return { "value": state.charAt(0).toUpperCase() + state.slice(1), "style": "text-success" }
			}
			else {
				const state = status.containerStatuses.find(el => !el.ready).state
				let style = "text-secondary"
				if ( state[Object.keys(state)].reason === "Completed") style = "text-success"
				if ( state[Object.keys(state)].reason === "Error") style = "text-danger"
				return { "value": state[Object.keys(state)].reason, "style": style }
			}
		},
		toReady(status, spec) {
			let containersReady = 0
			let containersLength = 0
			if ( spec.containers ) containersLength = spec.containers.length
			if ( status.containerStatuses ) containersReady = status.containerStatuses.filter(el => el.ready).length
			return `${containersReady}/${containersLength}`
		},
		sorted(val) {
			if(val) {
				let temp = [];
				for (let i = 0; i < val.length; i++) {
					for (let j = 0; j < val.length; j++) {
						if (val[i].idx < val[j].idx) {
							temp = val[i]
							val[i] = val[j]
							val[j] = temp
						}
					}
				}
			}
			return val
		},
		stringifyLabels(label) {
			if(!label) return [];
			try {
				return Object.entries(label).map(([name, value]) => `${name}=${value}`);
			} catch (e) {
				console.log(e);
			}
			return [];
		},
		getController(ref) {
			if (!ref) return
			let or = ref[0] ? ref[0] : ref
			let len = or.kind.length
			let k;
			if(or.kind[len-1] === 's') k = (or.kind).toLowerCase() + 'es'
			else k = (or.kind).toLowerCase() + 's'
			if(!or.apiVersion) return {g: '', k: k}
			let g = (or.apiVersion).split('/')
			if (g.length === 2) {
				return { g: g[0], k: k }
			} else {
				return { g: '', k: k}
			}
		},
		getApiUrl(group, rscName, namespace, name, query) {
			if(!namespace) namespace = ''
			let resource = this.resources()[group][rscName];
			if (resource) {
				let url
				if(namespace) {
					url = `/raw/clusters/${this.currentContext()}/${group ? "apis" : "api"}/${resource.groupVersion}/${resource.namespaced ? "namespaces/" + namespace + "/" : ""}${resource.name}`;
				}else {
					url = `/raw/clusters/${this.currentContext()}/${group ? "apis" : "api"}/${resource.groupVersion}/${resource.name}`;
				}
				return name ? `${url}/${name}${query ? '?' + query : ''}` : url+ (query ? '?' + query : '');
			} else {
				return "#";
			}
		},
		// Get currentContext's namespaces
		namespaces(_) {
			if (_) this.$store.commit("setNamespaces", _);
			else return this.$store.getters["getNamespaces"];
		},
		// Get contexts
		contexts(_) {
			if (_) this.$store.commit("setContexts", _);
			else return this.$store.getters["getContexts"];
		},
		// Get currentContext's resources
		resources(_) {
			if (_) this.$store.commit("setResources", _);
			else return this.$store.getters["getResources"];
		},
		// Get a currentContext
		currentContext(_) {
			if (_) this.$store.commit("setCurrentContext", _);
			else return this.$store.getters["getCurrentContext"];
		},
		selectNamespace(_) {
			if(_ === "") this.$store.commit("setSelectNamespace", _);
			if (_) this.$store.commit("setSelectNamespace", _);
			else return this.$store.getters["getSelectNamespace"];
		},
		statusbar(_) {
			if(_ === "") this.$store.commit("setStatusbar", _);
			if (_) this.$store.commit("setStatusbar", _);
			else return this.$store.getters["getStatusbar"];
		},
	},
});