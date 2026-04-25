import { Box, Typography, Chip, Skeleton } from "@mui/material";
import { Scissors, Bath } from "lucide-react";
import CustomCard from "../../components/Card/CustomCard";
import type { Appointment } from "../appointments/types";

type Props = {
  appointments: Appointment[];
  isFetching?: boolean;
};

export default function GroomingQueue({ appointments, isFetching }: Props) {
  const inProgress = appointments.filter((a) => a.status === "in_progress");

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Scissors size={20} />
          <Typography variant="h6" fontWeight={600}>
            Em Atendimento
          </Typography>
        </Box>
        {!isFetching && inProgress.length > 0 && (
          <Chip
            label={inProgress.length}
            color="info"
            size="small"
            sx={{ fontWeight: 700, minWidth: 28 }}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {isFetching ? (
          Array.from({ length: 2 }).map((_, i) => (
            <CustomCard key={i} sx={{ p: 1.5 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </CustomCard>
          ))
        ) : inProgress.length === 0 ? (
          <CustomCard sx={{ p: 2.5, textAlign: "center" }}>
            <Typography variant="body2" color="text.disabled">
              Nenhum atendimento em andamento
            </Typography>
          </CustomCard>
        ) : (
          inProgress.map((apt) => {
            const pets = apt.items.map((i) => i.pet.name).join(", ");
            const services = apt.items
              .flatMap((i) => i.services.map((s) => s.name))
              .filter((v, idx, arr) => arr.indexOf(v) === idx)
              .join(" · ");

            return (
              <CustomCard
                key={apt.id}
                sx={{
                  p: 1.5,
                  borderLeft: "3px solid",
                  borderColor: "info.main",
                }}
              >
                {/* Top row */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      {apt.client.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                      <Bath size={11} color="gray" />
                      <Typography variant="caption" color="text.disabled">
                        {pets}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label="Em andamento"
                    color="info"
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: "0.65rem", height: 20 }}
                  />
                </Box>

                {/* Services */}
                {services && (
                  <Typography variant="caption" color="text.primary" sx={{ display: "block", mt: 0.75 }}>
                    {services}
                  </Typography>
                )}
              </CustomCard>
            );
          })
        )}
      </Box>
    </Box>
  );
}
